import { BsActivity } from "react-icons/bs";
import { BiBarChart, BiChevronRight, BiLock } from "react-icons/bi";
import { FiZap } from "react-icons/fi";

function App() {
  const features = [
    {
      icon: FiZap,
      title: "Unified Monitoring",
      desc: "Watch servers, databases, and API endpoints from a single dashboard.",
    },
    {
      icon: BiBarChart,
      title: "Time-Series Insights",
      desc: "Visualize uptime, latency, and resource usage with hourly rollups.",
    },
    {
      icon: BiLock,
      title: "Keys & Limits",
      desc: "Secure API keys, usage limits, and subscription-based feature tiers.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-neon-green/30">
      <header className="p-6 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-2">
          <BsActivity className="text-neon-green" />
          <span className="font-bold font-mono tracking-tighter text-xl">
            Nubilus
          </span>
        </div>
        <button className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors cursor-pointer">
          Launch Dashboard
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="bg-dark-800/50 backdrop-blur-sm border border-white/10 px-4 py-1 rounded-full mb-8 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
          <span className="text-xs font-mono text-gray-400">
            Self-Hosted Monitoring
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl">
          One dashboard for
          <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-neon-green to-neon-blue">
            servers, APIs, and databases.
          </span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Self-hosted uptime monitoring with real-time alerts and beautiful
          status pages. Track endpoints, databases, and server health—zero
          third-party dependencies.
        </p>

        <div className="flex gap-4">
          <button className="px-8 py-4 bg-neon-green text-black font-bold rounded-xl hover:bg-neon-green/90 transition-all flex items-center gap-2 group cursor-pointer">
            Start Monitoring
            <BiChevronRight className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="px-8 py-4 bg-dark-800 border border-white/10 rounded-xl hover:bg-dark-700 transition-colors font-medium cursor-pointer">
            View GitHub
          </button>
        </div>

        {/* Feature Grid Mini */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-dark-800/30 border border-white/5 text-left hover:border-neon-green/30 transition-colors"
            >
              <f.icon className="w-8 h-8 text-neon-blue mb-4" />
              <h3 className="font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
