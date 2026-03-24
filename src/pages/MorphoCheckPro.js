// src/pages/MorphoCheckPro.js
import React, { useState, useRef, useEffect } from "react";
import InputForm from "../components/InputForm";
import AnalysisResults from "../components/AnalysisResults";
import { postAnalysis, generatePdf, sendRating as submitRatingApi } from "../services/api";

export default function MorphoCheckPro() {
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
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("form");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const resultsRef = useRef(null);

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
    if (!formData.firstName || !formData.lastName) return setError("Ism va familiya kerak");
    if (!formData.region || !formData.address) return setError("Viloyat va manzil kerak");
    if (formData.age < 2 || formData.age > 120)
      return setError("Yosh 2-120 oralig'ida bo'lishi kerak");
    if (formData.height < 50 || formData.height > 250) return setError("Bo'y 50-250 sm oralig'ida");
    if (formData.weight < 3 || formData.weight > 300) return setError("Vazn 3-300 kg oralig'ida");
    if (formData.chest < 50 || formData.chest > 200)
      return setError("Ko'krak aylanasi 50-200 sm oralig'ida");
    if (formData.head < 40 || formData.head > 70)
      return setError("Bosh aylanasi 40-70 sm oralig'ida");

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
      };

      const raw = await postAnalysis(payload);
      // 🔴 Muhimi: Normalizatsiya QILMAYMIZ. Backend qanday yuborsa shunday saqlaymiz:
      setResults(raw);
      setActiveTab("results");
    } catch (err) {
      setError(err.message || "Serverga ulanishda xato");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
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
      };

      const blob = await generatePdf(payload);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `morphocheck_${formData.firstName}_${formData.lastName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`PDF yaratishda xatolik: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };



  const submitRating = async () => {
    if (!rating) return setError("Bahoni tanlang");
    try {
      // Backend odatda {status, id, data:{...}} qaytaradi — id top-darajada
      const userId = Number.isFinite(Number(results?.id))
        ? Number(results.id)
        : Number.isFinite(Number(results?.data?.id))
          ? Number(results.data.id)
          : undefined;

      await submitRatingApi({
        score: Number(rating),
        comment: feedback,
        user_id: userId,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
      });

      alert("Bahoyingiz uchun rahmat!");
      setRating(0);
      setFeedback("");
    } catch (err) {
      setError("Baholashda xatolik: " + (err.message || "Yuborishda muammo"));
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
            rating={rating}
            setRating={setRating}
            feedback={feedback}
            setFeedback={setFeedback}
            submitRating={submitRating}
          />
        </div>
      )}
      {/* Dublikat chiqmasligi uchun alohida FeedbackForm-ni bu yerda chaqirmaymiz */}
    </div>
  );
}
