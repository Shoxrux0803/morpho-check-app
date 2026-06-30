import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div
      className="d-flex align-items-center justify-content-center position-relative overflow-hidden"
      style={{
        minHeight: '80vh',
        background: 'transparent',
        padding: '2rem',
      }}
    >
      {/* Background decoration elements */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          rotate: [0, 10, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          top: '5%',
          left: '15%',
          width: '350px',
          height: '350px',
          background:
            'radial-gradient(circle, rgba(15, 118, 110, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          zIndex: 0,
          filter: 'blur(20px)',
        }}
      />
      <motion.div
        animate={{
          y: [0, 30, 0],
          rotate: [0, -10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        style={{
          position: 'absolute',
          bottom: '5%',
          right: '15%',
          width: '450px',
          height: '450px',
          background:
            'radial-gradient(circle, rgba(20, 184, 166, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          zIndex: 0,
          filter: 'blur(25px)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="text-center"
        style={{
          zIndex: 1,
          maxWidth: '650px',
          backdropFilter: 'blur(10px)',
          padding: '2rem',
          borderRadius: '24px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotateX: -90 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.1,
            type: 'spring',
            bounce: 0.4,
          }}
        >
          <h1
            style={{
              fontSize: '9rem',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #0f766e, #14b8a6, #3b82f6)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '-1rem',
              lineHeight: 1,
            }}
          >
            404
          </h1>
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-3"
          style={{ fontWeight: 800, fontSize: '2rem' }}
        >
          Oops! {t('pageNotFound') || 'Sahifa topilmadi'}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-muted mb-5"
          style={{ fontSize: '1.2rem', lineHeight: '1.6' }}
        >
          {t('pageNotFoundDesc') ||
            "Manzil noto'g'ri yoki sahifa ko'chirilgan bo'lishi mumkin."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="d-flex justify-content-center gap-3 flex-wrap"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="btn btn-outline-secondary px-4 py-2 d-flex align-items-center gap-2 rounded-pill fw-medium"
            style={{
              transition: 'all 0.3s ease',
              borderWidth: '2px',
            }}
          >
            <i className="bi bi-arrow-left"></i>{' '}
            {t('backBtn') || 'Orqaga qaytish'}
          </motion.button>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/"
              className="btn btn-primary px-4 py-2 d-flex align-items-center gap-2 rounded-pill fw-medium text-white"
              style={{
                background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
                border: 'none',
                boxShadow: '0 8px 20px rgba(20, 184, 166, 0.3)',
              }}
            >
              <i className="bi bi-house-door-fill"></i>{' '}
              {t('home') || 'Bosh sahifa'}
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
