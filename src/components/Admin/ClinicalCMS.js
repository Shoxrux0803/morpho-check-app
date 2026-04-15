import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Stack,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Save from "@mui/icons-material/Save";
import Refresh from "@mui/icons-material/Refresh";
import Translate from "@mui/icons-material/Translate";
import EmojiObjects from "@mui/icons-material/EmojiObjects";
import HealthAndSafety from "@mui/icons-material/HealthAndSafety";
import Category from "@mui/icons-material/Category";
import { toast } from "react-hot-toast";
import { AdminApi } from "../../services/api";

const { clinical } = AdminApi;

const CATEGORIES = [
  { id: "advice", label: "Maslahatlar", icon: <EmojiObjects /> },
  { id: "bmi_categories", label: "BMI Kategoriyalari", icon: <Category /> },
  { id: "interpretations", label: "Interpretatsiyalar", icon: <Translate /> },
  { id: "standards", label: "Klinik Standartlar", icon: <HealthAndSafety /> },
];

const ClinicalCMS = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCat, setActiveCat] = useState("advice");
  const [saving, setSaving] = useState(null); // Key of the setting being saved

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clinical.list();
      setSettings(data);
    } catch (err) {
      setError(err.message || "Sozlamalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleRefreshCache = async () => {
    try {
      await clinical.refreshCache();
      toast.success("Kesh yangilandi!");
    } catch (err) {
      toast.error("Keshni yangilashda xatolik: " + err.message);
    }
  };

  const handleValueChange = (key, lang, newValue) => {
    setSettings((prev) =>
      prev.map((s) => {
        if (s.key === key) {
          return {
            ...s,
            value_json: {
              ...(s.value_json || {}),
              [lang]: newValue,
            },
          };
        }
        return s;
      })
    );
  };

  const handleSave = async (setting) => {
    setSaving(setting.key);
    try {
      await clinical.update(setting.key, {
        value_json: setting.value_json,
        label: setting.label,
        category: setting.category,
      });
      toast.success(`${setting.label} saqlandi!`);
    } catch (err) {
      toast.error("Saqlashda xatolik: " + err.message);
    } finally {
      setSaving(null);
    }
  };

  if (loading && !settings.length) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  const filteredSettings = settings.filter((s) => s.category === activeCat);

  return (
    <Box sx={{ p: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={800}>
          Klinik Kontent Boshqaruvi (CMS)
        </Typography>
        <Button
          startIcon={<Refresh />}
          onClick={handleRefreshCache}
          variant="outlined"
          color="info"
        >
          Keshni Yangilash
        </Button>
      </Stack>

      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={activeCat}
          onChange={(e, v) => setActiveCat(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          {CATEGORIES.map((cat) => (
            <Tab
              key={cat.id}
              value={cat.id}
              label={cat.label}
              icon={cat.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {filteredSettings.length === 0 ? (
        <Box textAlign="center" p={4} border="1px dashed grey" borderRadius={2}>
          <Typography color="text.secondary">Ushbu kategoriyada ma'lumotlar yo'q</Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {filteredSettings.map((s) => (
            <Accordion key={s.key} sx={{ borderRadius: 2, "&:before": { display: "none" }, boxShadow: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ width: "100%" }}>
                  <Typography fontWeight={600} sx={{ flexGrow: 1 }}>
                    {s.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                    ID: {s.key}
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  {["uz", "ru", "en", "kz"].map((lang) => (
                    <Grid item xs={12} md={6} key={lang}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label={lang.toUpperCase()}
                        value={s.value_json?.[lang] || ""}
                        onChange={(e) => handleValueChange(s.key, lang, e.target.value)}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                  ))}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="flex-end">
                      <Button
                        variant="contained"
                        startIcon={saving === s.key ? <CircularProgress size={20} color="inherit" /> : <Save />}
                        onClick={() => handleSave(s)}
                        disabled={saving === s.key}
                      >
                        Saqlash
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default ClinicalCMS;
