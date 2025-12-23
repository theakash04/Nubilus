//! HTTP API client for communicating with Nubilus backend

use anyhow::{Context, Result};
use reqwest::{Client, StatusCode};
use std::time::Duration;
use tracing::{debug, error, info, warn};

use crate::config::Config;
use crate::models::{MetricsPayload, RegisterRequest, RegisterResponse};

/// API client for Nubilus backend communication
pub struct ApiClient {
    client: Client,
    base_url: String,
    api_key: String,
}

/// Error types for API operations
#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("Authentication failed: invalid API key")]
    Unauthorized,
    
    #[error("Server not registered, need to re-register")]
    NotRegistered,
    
    #[error("Rate limited, backing off")]
    RateLimited,
    
    #[error("Server error: {0}")]
    ServerError(String),
    
    #[error("Network error: {0}")]
    NetworkError(#[from] reqwest::Error),
    
    #[error("Unexpected error: {0}")]
    Other(String),
}

impl ApiClient {
    /// Create a new API client from configuration
    pub fn new(config: &Config) -> Result<Self> {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .user_agent(format!("nubilus-agent/{}", env!("CARGO_PKG_VERSION")))
            .build()
            .context("Failed to create HTTP client")?;

        // Ensure base URL doesn't have trailing slash
        let base_url = config.server.api_url.trim_end_matches('/').to_string();

        Ok(Self {
            client,
            base_url,
            api_key: config.server.api_key.clone(),
        })
    }

    /// Register this server with the Nubilus platform
    pub async fn register(&self, request: &RegisterRequest) -> Result<String, ApiError> {
        let url = format!("{}/api/ingest/register", self.base_url);
        
        debug!("Registering server: {:?}", request);

        let response = self
            .client
            .post(&url)
            .header("X-API-Key", &self.api_key)
            .json(request)
            .send()
            .await?;

        match response.status() {
            StatusCode::OK | StatusCode::CREATED => {
                let body: RegisterResponse = response
                    .json()
                    .await
                    .map_err(|e| ApiError::Other(format!("Failed to parse response: {}", e)))?;
                
                if body.success {
                    let server_id = body
                        .data
                        .map(|d| d.server_id)
                        .unwrap_or_else(|| "unknown".to_string());
                    info!("Server registered successfully with ID: {}", server_id);
                    Ok(server_id)
                } else {
                    Err(ApiError::Other(body.message))
                }
            }
            StatusCode::UNAUTHORIZED => {
                error!("API key is invalid or expired");
                Err(ApiError::Unauthorized)
            }
            StatusCode::TOO_MANY_REQUESTS => {
                warn!("Rate limited during registration");
                Err(ApiError::RateLimited)
            }
            status if status.is_server_error() => {
                let body = response.text().await.unwrap_or_default();
                error!("Server error during registration: {} - {}", status, body);
                Err(ApiError::ServerError(body))
            }
            status => {
                let body = response.text().await.unwrap_or_default();
                Err(ApiError::Other(format!("Unexpected status {}: {}", status, body)))
            }
        }
    }

    /// Submit metrics to the Nubilus platform
    pub async fn submit_metrics(&self, metrics: &MetricsPayload) -> Result<(), ApiError> {
        let url = format!("{}/api/ingest/metrics", self.base_url);
        
        debug!("Submitting metrics: CPU={:.1}%, Mem={:.1}%", 
               metrics.cpu_usage, metrics.memory_usage);

        let response = self
            .client
            .post(&url)
            .header("X-API-Key", &self.api_key)
            .json(metrics)
            .send()
            .await?;

        self.handle_response(response, "submit metrics").await
    }

    /// Send a heartbeat to keep the server status active
    pub async fn heartbeat(&self) -> Result<(), ApiError> {
        let url = format!("{}/api/ingest/heartbeat", self.base_url);
        
        debug!("Sending heartbeat");

        let response = self
            .client
            .post(&url)
            .header("X-API-Key", &self.api_key)
            .send()
            .await?;

        self.handle_response(response, "heartbeat").await
    }

    /// Handle common response patterns
    async fn handle_response(
        &self,
        response: reqwest::Response,
        operation: &str,
    ) -> Result<(), ApiError> {
        match response.status() {
            StatusCode::OK | StatusCode::CREATED | StatusCode::NO_CONTENT => {
                debug!("{} successful", operation);
                Ok(())
            }
            StatusCode::UNAUTHORIZED => {
                error!("API key is invalid or expired");
                Err(ApiError::Unauthorized)
            }
            StatusCode::NOT_FOUND => {
                warn!("Server not found, may need to re-register");
                Err(ApiError::NotRegistered)
            }
            StatusCode::TOO_MANY_REQUESTS => {
                warn!("Rate limited");
                Err(ApiError::RateLimited)
            }
            status if status.is_server_error() => {
                let body = response.text().await.unwrap_or_default();
                error!("Server error during {}: {} - {}", operation, status, body);
                Err(ApiError::ServerError(body))
            }
            status => {
                let body = response.text().await.unwrap_or_default();
                Err(ApiError::Other(format!(
                    "Unexpected status {} during {}: {}",
                    status, operation, body
                )))
            }
        }
    }
}

/// Calculate exponential backoff duration
pub fn backoff_duration(attempt: u32) -> Duration {
    let base = 2u64;
    let max_delay = 300; // 5 minutes max
    let delay = base.saturating_pow(attempt).min(max_delay);
    Duration::from_secs(delay)
}
