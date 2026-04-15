// src/pages/MorphoCheckPro.js
import React, { useState, useRef, useEffect } from "react";
import InputForm from "../components/InputForm";
import AnalysisResults from "../components/AnalysisResults";
import { postAnalysis, generatePdf, generateDocx, sendRating as submitRatingApi } from "../services/api";
import { AdminApi } from "../services/AdminApi";
import { useAuth } from "../contexts/AuthContext";

import { useLanguage } from "../contexts/LanguageContext";
import { useOfflineSync } from "../providers/OfflineSyncProvider";
import { toast } from "react-hot-toast";

export default function MorphoCheckPro() {
  const { t, lang } = useLanguage();
  const { addToQueue, isOnline } = useOfflineSync();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    region: "",
    district: "",
    address: "",
    birthDate: "",
    examinationDate: "",
    age: "",
    ageMonths: 0,
    ageDays: 0,
    gender: "erkak",
    height: "",
    weight: "",
    chest: "",
    waist: "",
    head: "",
    shoulderLength: "",
    shoulderBreadth: "",
    shoulderCircumference: "",
    armElbowLength: "",
    handLength: "",
    thighLength: "",
    thighCircumference: "",
    calfLength: "",
    calfCircumference: "",
    footLength: "",
    // Bioimpedance
    totalBodyWater: "",
    fatPercent: "",
    fatMass: "",
    muscleMass: "",
    boneMass: "",
    acm: "",
    visceralFat: "",
    bodyLength: "",
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("form");
  const resultsRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "superadmin") {
      AdminApi.activity.pingFormStart().catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (formData.birthDate) {
      const birth = new Date(formData.birthDate);
      const exam = formData.examinationDate ? new Date(formData.examinationDate) : new Date();
      
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

      if (
        (formData.age !== years || formData.ageMonths !== months || formData.ageDays !== days) &&
        years >= 0
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

  const numericFields = ["age", "height", "weight", "chest", "waist", "head"];
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const v = numericFields.includes(name) && value !== "" ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [name]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Front tekshiruvlar...
    if (!formData.firstName || !formData.lastName) return setError(t("errNameRequired"));
    if (!formData.region || !formData.address) return setError(t("errRegionRequired"));
    if (formData.age < 2 || formData.age > 120) return setError(t("errAge"));
    if (formData.height < 50 || formData.height > 250) return setError(t("errHeight"));
    if (formData.weight < 3 || formData.weight > 300) return setError(t("errWeight"));
    if (formData.chest < 50 || formData.chest > 200) return setError(t("errChest"));
    if (formData.head < 40 || formData.head > 70) return setError(t("errHead"));

    setLoading(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        region: formData.region || "",
        district: formData.district || "",
        address: formData.address || "",
        age: Number(formData.age),
        ageMonths: Number(formData.ageMonths || 0),
        ageDays: Number(formData.ageDays || 0),
        gender: formData.gender,
        height: Number(formData.height),
        weight: Number(formData.weight),
        chest: Number(formData.chest),
        waist: Number(formData.waist || 0),
        head: Number(formData.head),
        examinationDate: formData.examinationDate || new Date().toISOString().split("T")[0],
        birthDate: formData.birthDate || "Noma'lum",
        preschoolInstitution: formData.preschoolInstitution || "Noma'lum",
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
        totalBodyWater: formData.totalBodyWater !== "" ? Number(formData.totalBodyWater) : null,
        fatPercent: formData.fatPercent !== "" ? Number(formData.fatPercent) : null,
        fatMass: formData.fatMass !== "" ? Number(formData.fatMass) : null,
        muscleMass: formData.muscleMass !== "" ? Number(formData.muscleMass) : null,
        boneMass: formData.boneMass !== "" ? Number(formData.boneMass) : null,
        acm: formData.acm !== "" ? Number(formData.acm) : null,
        visceralFat: formData.visceralFat !== "" ? Number(formData.visceralFat) : null,
        bodyLength: formData.bodyLength !== "" ? Number(formData.bodyLength) : null,
      };

      if (!navigator.onLine) {
        await addToQueue(payload, lang);
        setFormData({ ...formData, firstName: "", lastName: "" }); // Clear common fields or keep them?
        setActiveTab("form");
        return;
      }

      const raw = await postAnalysis(payload, lang);
      // 🔴 Muhimi: Normalizatsiya QILMAYMIZ. Backend qanday yuborsa shunday saqlaymiz:
      setResults(raw);
      setActiveTab("results");
    } catch (err) {
      setError(err.message || t("serverError"));
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (pdfLang) => {
    const selectedLang = pdfLang || lang;
    setLoading(true);
    setError("");
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        region: formData.region || "",
        district: formData.district || "",
        address: formData.address || "",
        age: Number(formData.age),
        gender: formData.gender,
        height: Number(formData.height),
        weight: Number(formData.weight),
        chest: Number(formData.chest),
        waist: Number(formData.waist || 0),
        head: Number(formData.head),
        examinationDate: formData.examinationDate || new Date().toISOString().split("T")[0],
        birthDate: formData.birthDate || t("unknown"),
        preschoolInstitution: formData.preschoolInstitution || t("unknown"),
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
        totalBodyWater: formData.totalBodyWater !== "" ? Number(formData.totalBodyWater) : null,
        fatPercent: formData.fatPercent !== "" ? Number(formData.fatPercent) : null,
        fatMass: formData.fatMass !== "" ? Number(formData.fatMass) : null,
        muscleMass: formData.muscleMass !== "" ? Number(formData.muscleMass) : null,
        boneMass: formData.boneMass !== "" ? Number(formData.boneMass) : null,
        acm: formData.acm !== "" ? Number(formData.acm) : null,
        visceralFat: formData.visceralFat !== "" ? Number(formData.visceralFat) : null,
        bodyLength: formData.bodyLength !== "" ? Number(formData.bodyLength) : null,
      };

      const blob = await generatePdf(payload, selectedLang);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `morphocheck_${formData.firstName}_${formData.lastName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`${t("pdfError")}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateDOCX = async (docxLang) => {
    const selectedLang = docxLang || lang;
    setLoading(true);
    setError("");
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        region: formData.region || "",
        district: formData.district || "",
        address: formData.address || "",
        age: Number(formData.age),
        gender: formData.gender,
        height: Number(formData.height),
        weight: Number(formData.weight),
        chest: Number(formData.chest),
        waist: Number(formData.waist || 0),
        head: Number(formData.head),
        examinationDate: formData.examinationDate || new Date().toISOString().split("T")[0],
        birthDate: formData.birthDate || t("unknown"),
        preschoolInstitution: formData.preschoolInstitution || t("unknown"),
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
        totalBodyWater: formData.totalBodyWater !== "" ? Number(formData.totalBodyWater) : null,
        fatPercent: formData.fatPercent !== "" ? Number(formData.fatPercent) : null,
        fatMass: formData.fatMass !== "" ? Number(formData.fatMass) : null,
        muscleMass: formData.muscleMass !== "" ? Number(formData.muscleMass) : null,
        boneMass: formData.boneMass !== "" ? Number(formData.boneMass) : null,
        acm: formData.acm !== "" ? Number(formData.acm) : null,
        visceralFat: formData.visceralFat !== "" ? Number(formData.visceralFat) : null,
        bodyLength: formData.bodyLength !== "" ? Number(formData.bodyLength) : null,
      };

      const blob = await generateDocx(payload, selectedLang);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
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
      const t = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  return (
    <div className="container my-4">
      {activeTab === "form" ? (
        <InputForm
          formData={formData}
          handleInputChange={handleInputChange}
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
            setActiveTab={setActiveTab}
          />
        </div>
      )}
      {/* Dublikat chiqmasligi uchun alohida FeedbackForm-ni bu yerda chaqirmaymiz */}
    </div>
  );
}
