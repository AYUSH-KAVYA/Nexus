import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient architectural lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[320px] bg-amber-500/8 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[260px] bg-orange-600/6 blur-[110px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex flex-col items-center justify-center mb-8 text-center">
          {/* Glowing Text Only — No Diamond Logo, No Animations */}
          <h1 className="text-3xl sm:text-4xl font-black tracking-[0.3em] text-amber-400 font-mono drop-shadow-[0_0_20px_rgba(245,158,11,0.7)] uppercase select-none">
            NEXUS
          </h1>
          <p className="text-xs text-zinc-400 tracking-[0.2em] font-medium mt-1.5 uppercase">
            Coordination Intelligence
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10 animate-fade-up">
        <div className="bg-zinc-900/85 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-2xl border border-zinc-800 shadow-2xl shadow-black/50">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
