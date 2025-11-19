// src/pages/CreateProfile.jsx (no UI library; plain React + CSS-in-JS)
// - Username required & unique (client-side format check only; server enforces uniqueness)
// - NYU Email is read-only (prefilled from /users/me/complete-profile/)
// - Optional: full_name, phone_number, dorm, bio (500 char limit)
// - Avatar upload via input[file], preview immediately, then POST to /users/me/upload-avatar/
//
// Adjust API import paths to your project.

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateProfile.css";

import {
  fetchMeStatus,
  fetchCompleteProfile,
  patchCompleteProfile,
  uploadAvatar,
} from "../api/users";
import { getLastAuthEmail, clearLastAuthEmail } from "../utils/authEmailStorage";

const USERNAME_REGEX = /^[a-zA-Z0-9_.]+$/;
const BIO_MAX = 500;

const DORM_OPTIONS = [
  { value: "WEINSTEIN", label: "Weinstein Hall" },
  { value: "GREENWICH", label: "Greenwich Hall" },
  { value: "PALLADIUM", label: "Palladium Hall" },
  { value: "THIRD_AVENUE_NORTH", label: "Third Avenue North" },
  { value: "FOUNDERS", label: "Founders Hall" },
  { value: "LIPTON", label: "Lipton Hall" },
  { value: "UHALL", label: "University Hall" },
  { value: "BRITTANY", label: "Brittany Hall" },
  { value: "OTHMER", label: "Othmer Residence Hall" },
];

export default function CreateProfile() {
  const navigate = useNavigate();

  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [email, setEmail] = useState(() => getLastAuthEmail());
  const [avatarUrl, setAvatarUrl] = useState("");
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    phone_number: "",
    dorm: "",
    bio: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: status } = await fetchMeStatus();
        if (!alive) return;
        if (status?.profile_complete) {
          navigate("/", { replace: true });
          return;
        }
      } catch (_) {}

      try {
        const { data } = await fetchCompleteProfile();
        if (!alive) return;
        setEmail(data.email || getLastAuthEmail());
        setAvatarUrl(data.avatar_url || "");
        setForm({
          username: data.username || "",
          full_name: data.full_name || "",
          phone_number: data.phone_number || "",
          dorm: data.dorm || "",
          bio: data.bio || "",
        });
      } catch (_) {
      } finally {
        if (alive) setInitializing(false);
      }
    })();
    return () => { alive = false; };
  }, [navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.username.trim()) next.username = "Please choose a username";
    else if (!USERNAME_REGEX.test(form.username)) next.username = "Only letters, numbers, _ and . are allowed";
    else if (form.username.length > 30) next.username = "Max 30 characters";

    if (form.bio && form.bio.length > BIO_MAX) next.bio = `Max ${BIO_MAX} characters`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleUpload = async (file) => {
    if (!file) return;
    const okType = ["image/jpeg","image/png","image/webp"].includes(file.type);
    if (!okType) return alert("Only JPG/PNG/WebP images are allowed");
    if (file.size / 1024 / 1024 >= 5) return alert("Image must be smaller than 5MB");

    setUploading(true);
    try {
      const { data } = await uploadAvatar(file);
      setAvatarUrl(data.url);
    } catch (e) {
      console.error(e);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, avatar_url: avatarUrl || undefined };
      await patchCompleteProfile(payload);
      alert("Profile completed! Welcome to NYU Marketplace.");
      clearLastAuthEmail();
      navigate("/", { replace: true });
    } catch (err) {
      const apiErr = err?.response?.data || {};
      if (apiErr.username?.length) setErrors((p) => ({ ...p, username: apiErr.username[0] }));
      else alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const bioCount = useMemo(() => form.bio.length, [form.bio]);

  return (
    <div className="cp-page">
      <div className="cp-card">
        <div className="cp-header">
          <div className="cp-icon">✓</div>
          <h1 className="cp-title">Complete Your Profile</h1>
          <p className="cp-subtitle">
            Let's set up your profile to get started on NYU Marketplace
          </p>
        </div>

        <div className="cp-avatarSection">
          <div className="cp-avatarWrap">
            {avatarUrl ? (
              <img className="cp-avatarImg" src={avatarUrl} alt="avatar" />
            ) : (
              <span className="cp-avatarPlaceholder">?</span>
            )}
          </div>

          <label className="cp-uploadBtn">
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              disabled={uploading}
              onChange={(e) => handleUpload(e.target.files?.[0])}
            />
            {uploading ? "Uploading..." : "Upload Photo"}
          </label>
          <div className="cp-hint">Optional – You can add a photo later</div>
        </div>

        {initializing ? (
          <div className="cp-loading">Loading…</div>
        ) : (
          <form className="cp-form" onSubmit={onSubmit}>
            <div className="cp-field">
              <label className="cp-label">Full Name</label>
              <input
                className="cp-input"
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={onChange}
                placeholder="Enter your full name"
                autoComplete="name"
              />
            </div>

            <div className="cp-field">
              <label className="cp-label">Username<span className="cp-req">*</span></label>
              <input
                className={`cp-input ${errors.username ? "cp-input--error" : ""}`}
                type="text"
                name="username"
                value={form.username}
                onChange={onChange}
                placeholder="Choose a unique username"
                autoComplete="username"
              />
              {errors.username && <div className="cp-error">{errors.username}</div>}
              <div className="cp-help">This will be your unique identifier on the platform</div>
            </div>

            <div className="cp-field">
              <label className="cp-label">NYU Email</label>
              <input className="cp-input cp-input--readonly" type="email" value={email} readOnly />
            </div>

            <div className="cp-field">
              <label className="cp-label">Phone Number</label>
              <input
                className="cp-input"
                type="tel"
                name="phone_number"
                value={form.phone_number}
                onChange={onChange}
                placeholder="(555) 123-4567"
                autoComplete="tel"
              />
              <div className="cp-help">Optional – Helps buyers contact you</div>
            </div>

            <div className="cp-field">
              <label className="cp-label">Dorm/Residence</label>
              <select className="cp-select" name="dorm" value={form.dorm} onChange={onChange}>
                <option value="">Select your dorm</option>
                {DORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="cp-field">
              <label className="cp-label">Bio</label>
              <textarea
                className={`cp-textarea ${errors.bio ? "cp-input--error" : ""}`}
                name="bio"
                rows={4}
                value={form.bio}
                onChange={onChange}
                placeholder="Tell others about yourself... (optional)"
                maxLength={BIO_MAX}
              />
              <div className="cp-count">{bioCount}/{BIO_MAX}</div>
              {errors.bio && <div className="cp-error">{errors.bio}</div>}
            </div>

            <button className="cp-primaryBtn" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Complete Setup & Start Shopping"}
            </button>
            <div className="cp-footnote">
              You can always update your profile later in settings
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
