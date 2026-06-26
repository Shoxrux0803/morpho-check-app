// src/pages/MorphoCheckPro.js
import React, { useState, useRef, useEffect } from 'react';
import InputForm from '../components/InputForm';
import AnalysisResults from '../components/AnalysisResults';
import { postAnalysis, generatePdf, generateDocx } from '../services/api';
import { AdminApi } from '../services/AdminApi';
import { useAuth } from '../contexts/AuthContext';
import {
  canUsePermission,
  normalizeAdminPermissions,
} from '../utils/adminPermissions';

import { useLanguage } from '../contexts/LanguageContext';
import { useOfflineSync } from '../providers/OfflineSyncProvider';
import { toast } from 'react-hot-toast';

const FORM_DRAFT_KEY = 'morphocheck.analysisFormDraft.v1';
const emptyFormData = {
  firstName: '',
  lastName: '',
  region: '',
  district: '',
  mahalla: '',
  address: '',
  birthDate: '',
  examinationDate: '',
  age: '',
  ageMonths: 0,
  ageDays: 0,
  gender: 'erkak',
  height: '',
  weight: '',
  chest: '',
  waist: '',
  head: '',
  parentsPhone: '',
  shoulderLength: '',
  shoulderBreadth: '',
  shoulderCircumference: '',
  armElbowLength: '',
  handLength: '',
  thighLength: '',
  thighCircumference: '',
  calfLength: '',
  calfCircumference: '',
  footLength: '',
  totalBodyWater: '',
  fatPercent: '',
  fatMass: '',
  muscleMass: '',
  boneMass: '',
  acm: '',
  visceralFat: '',
  bodyLength: '',
  doctorNote: '',
  consentConfirmed: false,
  consentGuardianName: '',
  consentGuardianRelationship: '',
  consentGuardianPhone: '',
  consentPolicyVersion: 'helsinki-declaration-consent-v1',
  ppe_group_play: '',
  ppe_physical_activity: '',
  ppe_fatigue_activity: '',
  ppe_peer_interaction: '',
  ppe_preschool_routines: '',
  ppe_motor_confidence: '',
  ppe_structured_activities: '',
  ppe_daily_physical_activity: '',
  ppe_outdoor_play: '',
  ppe_fatigue_home: '',
  ppe_sleep_routine: '',
  ppe_screen_time: '',
  ppe_appetite: '',
};

const loadDraft = () => {
  try {
    const raw = localStorage.getItem(FORM_DRAFT_KEY);
    return raw ? { ...emptyFormData, ...JSON.parse(raw) } : emptyFormData;
  } catch {
    return emptyFormData;
  }
};

export default function MorphoCheckPro() {
  const { lang, t } = useLanguage();
  const {
    addToQueue,
    isOnline,
    editingItem,
    setEditingItem,
    updateQueueItem,
    removeFromQueue,
  } = useOfflineSync();
  const [formData, setFormData] = useState(loadDraft);

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('form');
  const resultsRef = useRef(null);
  const { user } = useAuth();
  const adminPermissions = normalizeAdminPermissions(user?.admin_permissions);
  const applyAdminPermissionsToPayload = (payload) => {
    const next = { ...payload };
    const fieldMap = {
      shoulder_length: 'shoulderLength',
      shoulder_breadth: 'shoulderBreadth',
      shoulder_circumference: 'shoulderCircumference',
      arm_elbow_length: 'armElbowLength',
      hand_length: 'handLength',
      thigh_length: 'thighLength',
      thigh_circumference: 'thighCircumference',
      calf_length: 'calfLength',
      calf_circumference: 'calfCircumference',
      foot_length: 'footLength',
    };
    Object.entries(fieldMap).forEach(([permissionKey, payloadKey]) => {
      if (!canUsePermission(adminPermissions, permissionKey))
        delete next[payloadKey];
    });
    if (!canUsePermission(adminPermissions, 'play_preschool_engagement')) {
      delete next.playPreschoolEngagement;
    }
    if (!canUsePermission(adminPermissions, 'bioimpedance')) {
      [
        'totalBodyWater',
        'fatPercent',
        'fatMass',
        'muscleMass',
        'boneMass',
        'acm',
        'visceralFat',
        'bodyLength',
      ].forEach((key) => delete next[key]);
    }
    return next;
  };

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      AdminApi.activity.pingFormStart().catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(formData));
    } catch {}
  }, [formData]);

  // Load editing item into form
  useEffect(() => {
    if (editingItem) {
      setFormData((prev) => ({
        ...prev,
        ...editingItem.payload,
      }));
      toast.success(t('fixingOfflineRecord') || 'Fixing offline record...', {
        icon: '🔧',
      });
      setError('');
      setActiveTab('form');
    }
  }, [editingItem, t]);

  useEffect(() => {
    if (formData.birthDate) {
      const birth = new Date(formData.birthDate);
      const exam = formData.examinationDate
        ? new Date(formData.examinationDate)
        : new Date();

      let years = exam.getFullYear() - birth.getFullYear();
      let months = exam.getMonth() - birth.getMonth();
      let days = exam.getDate() - birth.getDate();

      if (days < 0) {
        months -= 1;
        const lastMonth = new Date(exam.getFullYear(), exam.getMonth(), 0);
        days += lastMonth.getDate();
      }

      if (months < 0) {
        years -= 1;
        months += 12;
      }

      if (years < 0) {
        setFormData((prev) => ({ ...prev, age: '', ageMonths: 0, ageDays: 0 }));
        return;
      }

      if (
        formData.age !== years ||
        formData.ageMonths !== months ||
        formData.ageDays !== days
      ) {
        setFormData((prev) => ({
          ...prev,
          age: years,
          ageMonths: months,
          ageDays: days,
        }));
      }
    }
  }, [formData.birthDate, formData.examinationDate]);

  const numericFields = [
    'age',
    'height',
    'weight',
    'chest',
    'waist',
    'head',
    'fatherHeight',
    'motherHeight',
  ];
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const v =
      numericFields.includes(name) && value !== '' ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [name]: v }));
  };

  const handleBulkUpdate = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const requiresGuardianConsent =
    Number(formData.age) > 0 && Number(formData.age) < 18;
  const consentPayload = {
    consentConfirmed: requiresGuardianConsent
      ? Boolean(formData.consentConfirmed)
      : false,
    consentGuardianName: requiresGuardianConsent
      ? formData.consentGuardianName || ''
      : '',
    consentGuardianRelationship: requiresGuardianConsent
      ? formData.consentGuardianRelationship || ''
      : '',
    consentGuardianPhone: requiresGuardianConsent
      ? formData.consentGuardianPhone || formData.parentsPhone || ''
      : '',
    consentPolicyVersion:
      formData.consentPolicyVersion || 'helsinki-declaration-consent-v1',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Front tekshiruvlar...
    if (!formData.firstName || !formData.lastName)
      return setError(t('errNameRequired'));
    if (!formData.region) return setError(t('errRegionRequired'));
    if (formData.age < 2 || formData.age > 120) return setError(t('errAge'));
    if (formData.height < 50 || formData.height > 250)
      return setError(t('errHeight'));
    if (formData.weight < 3 || formData.weight > 300)
      return setError(t('errWeight'));
    if (formData.chest < 50 || formData.chest > 200)
      return setError(t('errChest'));
    if (formData.head < 40 || formData.head > 70) return setError(t('errHead'));
    if (requiresGuardianConsent && !formData.consentConfirmed) {
      return setError('Ota-ona yoki vasiyning roziligi tasdiqlanishi kerak.');
    }
    if (
      requiresGuardianConsent &&
      !String(formData.consentGuardianName || '').trim()
    ) {
      return setError(
        'Rozilik bergan ota-ona yoki vasiyning ismi kiritilishi kerak.'
      );
    }

    setLoading(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        region: formData.region || '',
        district: formData.district || '',
        mahalla: formData.mahalla || '',
        address: formData.address || '',
        age: Number(formData.age),
        ageMonths: Number(formData.ageMonths || 0),
        ageDays: Number(formData.ageDays || 0),
        gender: formData.gender,
        height: Number(formData.height),
        weight: Number(formData.weight),
        chest: Number(formData.chest),
        waist: Number(formData.waist || 0),
        head: Number(formData.head),
        parentsPhone: requiresGuardianConsent
          ? formData.parentsPhone || ''
          : '',
        fatherHeight: formData.fatherHeight
          ? Number(formData.fatherHeight)
          : null,
        motherHeight: formData.motherHeight
          ? Number(formData.motherHeight)
          : null,
        examinationDate:
          formData.examinationDate || new Date().toISOString().split('T')[0],
        birthDate: formData.birthDate || t('unknown'),
        preschoolInstitution: formData.preschoolInstitution || t('unknown'),
        shoulderLength: Number(formData.shoulderLength) || 0,
        shoulderBreadth: Number(formData.shoulderBreadth) || 0,
        shoulderCircumference: Number(formData.shoulderCircumference) || 0,
        armElbowLength: Number(formData.armElbowLength) || 0,
        handLength: Number(formData.handLength) || 0,
        thighLength: Number(formData.thighLength) || 0,
        thighCircumference: Number(formData.thighCircumference) || 0,
        calfLength: Number(formData.calfLength) || 0,
        calfCircumference: Number(formData.calfCircumference) || 0,
        footLength: Number(formData.footLength) || 0,
        // Bioimpedance
        totalBodyWater:
          formData.totalBodyWater !== ''
            ? Number(formData.totalBodyWater)
            : null,
        fatPercent:
          formData.fatPercent !== '' ? Number(formData.fatPercent) : null,
        fatMass: formData.fatMass !== '' ? Number(formData.fatMass) : null,
        muscleMass:
          formData.muscleMass !== '' ? Number(formData.muscleMass) : null,
        boneMass: formData.boneMass !== '' ? Number(formData.boneMass) : null,
        acm: formData.acm !== '' ? Number(formData.acm) : null,
        visceralFat:
          formData.visceralFat !== '' ? Number(formData.visceralFat) : null,
        bodyLength:
          formData.bodyLength !== '' ? Number(formData.bodyLength) : null,
        doctorNote: formData.doctorNote || '',
        playPreschoolEngagement: JSON.stringify({
          ppe_group_play: formData.ppe_group_play || '',
          ppe_physical_activity: formData.ppe_physical_activity || '',
          ppe_fatigue_activity: formData.ppe_fatigue_activity || '',
          ppe_peer_interaction: formData.ppe_peer_interaction || '',
          ppe_preschool_routines: formData.ppe_preschool_routines || '',
          ppe_motor_confidence: formData.ppe_motor_confidence || '',
          ppe_structured_activities: formData.ppe_structured_activities || '',
          ppe_daily_physical_activity: formData.ppe_daily_physical_activity || '',
          ppe_outdoor_play: formData.ppe_outdoor_play || '',
          ppe_fatigue_home: formData.ppe_fatigue_home || '',
          ppe_sleep_routine: formData.ppe_sleep_routine || '',
          ppe_screen_time: formData.ppe_screen_time || '',
          ppe_appetite: formData.ppe_appetite || '',
        }),
        ...consentPayload,
      };

      const filteredPayload = applyAdminPermissionsToPayload(payload);

      if (!navigator.onLine) {
        if (editingItem) {
          await updateQueueItem(editingItem.id, filteredPayload);
          setEditingItem(null);
        } else {
          await addToQueue(filteredPayload, lang);
        }
        setFormData({ ...formData, firstName: '', lastName: '' });
        setActiveTab('form');
        return;
      }

      // If online but we were fixing an item, try to send and then remove from queue
      const raw = await postAnalysis(filteredPayload, lang);

      if (editingItem) {
        await removeFromQueue(editingItem.id);
        setEditingItem(null);
        toast.success('Corrected and synced!');
      }
      localStorage.removeItem(FORM_DRAFT_KEY);
      setResults(raw);
      setActiveTab('results');
    } catch (err) {
      setError(err.message || t('serverError'));
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    setResults(null);
    setFormData((prev) => ({
      ...prev,
      firstName: '',
      lastName: '',
      birthDate: '',
      age: '',
      ageMonths: 0,
      ageDays: 0,
      height: '',
      weight: '',
      chest: '',
      waist: '',
      head: '',
      parentsPhone: '',
      fatherHeight: '',
      motherHeight: '',
      shoulderLength: '',
      shoulderBreadth: '',
      shoulderCircumference: '',
      armElbowLength: '',
      handLength: '',
      thighLength: '',
      thighCircumference: '',
      calfLength: '',
      calfCircumference: '',
      footLength: '',
      totalBodyWater: '',
      fatPercent: '',
      fatMass: '',
      muscleMass: '',
      boneMass: '',
      acm: '',
      visceralFat: '',
      bodyLength: '',
      doctorNote: '',
      // We keep region, district, mahalla, address, and examinationDate for faster multi-entry
    }));
    setActiveTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generatePDF = async (pdfLang) => {
    const selectedLang = pdfLang || lang;
    setLoading(true);
    setError('');
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        analysisId: results?.data?.id,
        region: formData.region || '',
        district: formData.district || '',
        mahalla: formData.mahalla || '',
        address: formData.address || '',
        age: Number(formData.age),
        ageMonths: Number(formData.ageMonths || 0),
        ageDays: Number(formData.ageDays || 0),
        gender: formData.gender,
        height: Number(formData.height),
        weight: Number(formData.weight),
        chest: Number(formData.chest),
        waist: Number(formData.waist || 0),
        head: Number(formData.head),
        parentsPhone: requiresGuardianConsent
          ? formData.parentsPhone || ''
          : '',
        fatherHeight: formData.fatherHeight
          ? Number(formData.fatherHeight)
          : null,
        motherHeight: formData.motherHeight
          ? Number(formData.motherHeight)
          : null,
        examinationDate:
          formData.examinationDate || new Date().toISOString().split('T')[0],
        birthDate: formData.birthDate || t('unknown'),
        preschoolInstitution: formData.preschoolInstitution || t('unknown'),
        shoulderLength: Number(formData.shoulderLength) || 0,
        shoulderBreadth: Number(formData.shoulderBreadth) || 0,
        shoulderCircumference: Number(formData.shoulderCircumference) || 0,
        armElbowLength: Number(formData.armElbowLength) || 0,
        handLength: Number(formData.handLength) || 0,
        thighLength: Number(formData.thighLength) || 0,
        thighCircumference: Number(formData.thighCircumference) || 0,
        calfLength: Number(formData.calfLength) || 0,
        calfCircumference: Number(formData.calfCircumference) || 0,
        footLength: Number(formData.footLength) || 0,
        playPreschoolEngagement: JSON.stringify({
          ppe_group_play: formData.ppe_group_play || '',
          ppe_physical_activity: formData.ppe_physical_activity || '',
          ppe_fatigue_activity: formData.ppe_fatigue_activity || '',
          ppe_peer_interaction: formData.ppe_peer_interaction || '',
          ppe_preschool_routines: formData.ppe_preschool_routines || '',
          ppe_motor_confidence: formData.ppe_motor_confidence || '',
          ppe_structured_activities: formData.ppe_structured_activities || '',
          ppe_daily_physical_activity: formData.ppe_daily_physical_activity || '',
          ppe_outdoor_play: formData.ppe_outdoor_play || '',
          ppe_fatigue_home: formData.ppe_fatigue_home || '',
          ppe_sleep_routine: formData.ppe_sleep_routine || '',
          ppe_screen_time: formData.ppe_screen_time || '',
          ppe_appetite: formData.ppe_appetite || '',
        }),
        // Bioimpedance
        totalBodyWater:
          formData.totalBodyWater !== ''
            ? Number(formData.totalBodyWater)
            : null,
        fatPercent:
          formData.fatPercent !== '' ? Number(formData.fatPercent) : null,
        fatMass: formData.fatMass !== '' ? Number(formData.fatMass) : null,
        muscleMass:
          formData.muscleMass !== '' ? Number(formData.muscleMass) : null,
        boneMass: formData.boneMass !== '' ? Number(formData.boneMass) : null,
        acm: formData.acm !== '' ? Number(formData.acm) : null,
        visceralFat:
          formData.visceralFat !== '' ? Number(formData.visceralFat) : null,
        bodyLength:
          formData.bodyLength !== '' ? Number(formData.bodyLength) : null,
        doctorNote: formData.doctorNote || '',
        ...consentPayload,
      };

      const blob = await generatePdf(
        applyAdminPermissionsToPayload(payload),
        selectedLang
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `morphocheck_${formData.firstName}_${formData.lastName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`${t('pdfError')}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateDOCX = async (docxLang) => {
    const selectedLang = docxLang || lang;
    setLoading(true);
    setError('');
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        region: formData.region || '',
        district: formData.district || '',
        mahalla: formData.mahalla || '',
        address: formData.address || '',
        age: Number(formData.age),
        ageMonths: Number(formData.ageMonths || 0),
        ageDays: Number(formData.ageDays || 0),
        gender: formData.gender,
        height: Number(formData.height),
        weight: Number(formData.weight),
        chest: Number(formData.chest),
        waist: Number(formData.waist || 0),
        head: Number(formData.head),
        parentsPhone: requiresGuardianConsent
          ? formData.parentsPhone || ''
          : '',
        fatherHeight: formData.fatherHeight
          ? Number(formData.fatherHeight)
          : null,
        motherHeight: formData.motherHeight
          ? Number(formData.motherHeight)
          : null,
        examinationDate:
          formData.examinationDate || new Date().toISOString().split('T')[0],
        birthDate: formData.birthDate || t('unknown'),
        preschoolInstitution: formData.preschoolInstitution || t('unknown'),
        shoulderLength: Number(formData.shoulderLength) || 0,
        shoulderBreadth: Number(formData.shoulderBreadth) || 0,
        shoulderCircumference: Number(formData.shoulderCircumference) || 0,
        armElbowLength: Number(formData.armElbowLength) || 0,
        handLength: Number(formData.handLength) || 0,
        thighLength: Number(formData.thighLength) || 0,
        thighCircumference: Number(formData.thighCircumference) || 0,
        calfLength: Number(formData.calfLength) || 0,
        calfCircumference: Number(formData.calfCircumference) || 0,
        footLength: Number(formData.footLength) || 0,
        // Bioimpedance
        totalBodyWater:
          formData.totalBodyWater !== ''
            ? Number(formData.totalBodyWater)
            : null,
        fatPercent:
          formData.fatPercent !== '' ? Number(formData.fatPercent) : null,
        fatMass: formData.fatMass !== '' ? Number(formData.fatMass) : null,
        muscleMass:
          formData.muscleMass !== '' ? Number(formData.muscleMass) : null,
        boneMass: formData.boneMass !== '' ? Number(formData.boneMass) : null,
        acm: formData.acm !== '' ? Number(formData.acm) : null,
        visceralFat:
          formData.visceralFat !== '' ? Number(formData.visceralFat) : null,
        bodyLength:
          formData.bodyLength !== '' ? Number(formData.bodyLength) : null,
        doctorNote: formData.doctorNote || '',
        ...consentPayload,
      };

      const blob = await generateDocx(
        applyAdminPermissionsToPayload(payload),
        selectedLang
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `morphocheck_${formData.firstName}_${formData.lastName}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`DOCX error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  return (
    <div className="mc-analysis-page">
      <div className="container my-4 mc-analysis-content">
        {activeTab === 'form' ? (
          <InputForm
            formData={formData}
            handleInputChange={handleInputChange}
            onBulkUpdate={handleBulkUpdate}
            handleSubmit={handleSubmit}
            loading={loading}
            error={error}
          />
        ) : (
          <div ref={resultsRef}>
            <AnalysisResults
              formData={formData}
              results={results}
              generatePDF={generatePDF}
              onContinue={handleContinue}
            />
          </div>
        )}
        {/* Dublikat chiqmasligi uchun alohida FeedbackForm-ni bu yerda chaqirmaymiz */}
      </div>
    </div>
  );
}
