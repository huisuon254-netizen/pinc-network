import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '../../i18n';

interface SeedPhraseBackupProps {
  seedPhrase: string;
  onComplete: () => void;
  onSkip: () => void;
}

export const SeedPhraseBackup: React.FC<SeedPhraseBackupProps> = ({
  seedPhrase,
  onComplete,
  onSkip,
}) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const seedWords = seedPhrase.split(' ');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(seedPhrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/90 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/30 max-w-2xl mx-auto"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('wallet.backup_seed')}</h2>
        <p className="text-gray-400">{t('wallet.backup_seed_warning')}</p>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-3 gap-2">
          {seedWords.map((word, index) => (
            <div key={index} className="flex items-center space-x-2 bg-gray-700 rounded-lg p-2">
              <span className="text-purple-400 text-sm w-6">{index + 1}.</span>
              <span className="text-white font-mono">{word}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={copyToClipboard}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-xl transition-all"
        >
          {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
        </button>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
          />
          <span className="text-white">{t('login.confirm_seed')}</span>
        </label>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onSkip}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-xl transition-all"
        >
          Skip for Now
        </button>
        <button
          onClick={onComplete}
          disabled={!confirmed}
          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('common.save')}
        </button>
      </div>
    </motion.div>
  );
};
