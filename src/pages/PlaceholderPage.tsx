import React from 'react';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';

interface PlaceholderProps {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderProps> = ({ title }) => {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-12 bg-[#0f172a]/50 backdrop-blur-md border border-white/5 rounded-3xl"
        >
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mx-auto mb-6">
            <Construction className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">{title}</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            This module is currently under development as part of the Renew AI Enterprise Console expansion.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="mt-8 px-6 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-slate-200 transition-all"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    </Layout>
  );
};

export default PlaceholderPage;
