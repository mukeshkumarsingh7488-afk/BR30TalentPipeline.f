import { useCallback, useEffect, useMemo, useState } from "react";

import { Plus, Search, RefreshCw, Pencil, Trash2, X, BriefcaseBusiness, Building2, CheckCircle2, XCircle, Save, RotateCcw } from "lucide-react";

import { getJobRoles, createJobRole, updateJobRole, setJobRoleStatus, deleteJobRole } from "../../api/job-role.api.js";

import { getDepartments } from "../../api/department.api.js";

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },

  { value: "part_time", label: "Part-time" },

  { value: "contract", label: "Contract" },

  { value: "internship", label: "Internship" },

  { value: "freelance", label: "Freelance" },
];

const WORK_MODES = [
  { value: "onsite", label: "On-site" },

  { value: "hybrid", label: "Hybrid" },

  { value: "remote", label: "Remote" },
];

const ROLE_SUGGESTIONS = [
  {
    category: "Technology",

    roles: [
      "Software Engineer",

      "Frontend Developer",

      "Backend Developer",

      "Full Stack Developer",

      "React Developer",

      "Node.js Developer",

      "Mobile App Developer",

      "QA Engineer",

      "Automation Tester",

      "DevOps Engineer",

      "Cloud Engineer",

      "Cybersecurity Analyst",

      "Data Analyst",

      "Data Scientist",

      "AI/ML Engineer",

      "UI/UX Designer",

      "Product Manager",

      "Technical Support Engineer",

      "IT Support Executive",

      "Technical Lead",

      "Engineering Manager",
    ],
  },

  {
    category: "Sales & Marketing",

    roles: [
      "Sales Executive",

      "Business Development Executive",

      "Business Development Manager",

      "Sales Manager",

      "Digital Marketing Executive",

      "SEO Specialist",

      "Social Media Manager",

      "Content Writer",

      "Performance Marketing Specialist",

      "Marketing Manager",

      "Telecaller",

      "Inside Sales Executive",

      "Account Manager",
    ],
  },

  { category: "HR & Administration", roles: ["HR Executive", "HR Manager", "Talent Acquisition Specialist", "Recruiter", "HR Business Partner", "Payroll Executive", "Office Administrator", "Admin Executive", "Receptionist", "Operations Executive"] },

  { category: "Finance & Accounts", roles: ["Accountant", "Senior Accountant", "Finance Executive", "Finance Manager", "Accounts Payable Executive", "Accounts Receivable Executive", "Tax Consultant", "Audit Executive", "Billing Executive"] },

  { category: "Customer Support", roles: ["Customer Support Executive", "Customer Success Manager", "Customer Care Executive", "Technical Support Executive", "Helpdesk Executive", "Customer Relationship Manager"] },

  { category: "Operations & Logistics", roles: ["Operations Manager", "Operations Executive", "Logistics Coordinator", "Supply Chain Manager", "Warehouse Executive", "Inventory Manager", "Delivery Executive", "Fleet Manager", "Procurement Executive"] },

  { category: "Design & Creative", roles: ["Graphic Designer", "Video Editor", "Motion Graphics Designer", "Photographer", "Creative Designer", "Content Creator", "Brand Designer"] },

  { category: "Leadership & Other", roles: ["Project Manager", "Program Manager", "Business Analyst", "Management Trainee", "Research Analyst", "Legal Executive", "Legal Counsel", "Quality Analyst", "Trainer", "Intern"] },
];

const EMPTY_FORM = {
  title: "",

  departmentId: "",

  description: "",

  responsibilitiesText: "",

  requiredSkillsText: "",

  preferredSkillsText: "",

  minExperienceYears: "0",

  maxExperienceYears: "",

  employmentType: "full_time",

  workMode: "hybrid",

  location: "",

  salaryMin: "",

  salaryMax: "",

  currency: "INR",

  isActive: true,
};

const titleCase = (value = "") =>
  String(value)
    .replaceAll("\_", " ")

    .replace(/\b\w/g, (char) => char.toUpperCase());

const unwrap = (response) => response?.data?.data ?? response?.data ?? [];
const errorMessage = (error) => error?.response?.data?.message || error?.response?.data?.error || error?.message || "Something went wrong. Please try again.";

const getId = (item) => item?._id || item?.id || "";

const toLines = (value) =>
  String(value || "")
    .split(/\n|,/)

    .map((item) => item.trim())

    .filter(Boolean);

const formatMoney = (amount, currency = "INR") => {
  if (amount === null || amount === undefined || amount === "") return "";

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",

      currency,

      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `${currency} ${amount}`;
  }
};

const toForm = (role) => ({
  title: role?.title || "",

  departmentId: getId(role?.departmentId) || role?.departmentId || "",

  description: role?.description || "",

  responsibilitiesText: (role?.responsibilities || []).join("\n"),

  requiredSkillsText: (role?.requiredSkills || []).join(", "),

  preferredSkillsText: (role?.preferredSkills || []).join(", "),

  minExperienceYears: String(role?.minExperienceYears ?? 0),

  maxExperienceYears: role?.maxExperienceYears === null || role?.maxExperienceYears === undefined ? "" : String(role.maxExperienceYears),

  employmentType: role?.employmentType || "full_time",

  workMode: role?.workMode || "hybrid",

  location: role?.location || "",

  salaryMin: role?.salaryMin === null || role?.salaryMin === undefined ? "" : String(role.salaryMin),

  salaryMax: role?.salaryMax === null || role?.salaryMax === undefined ? "" : String(role.salaryMax),

  currency: role?.currency || "INR",

  isActive: role?.isActive !== false,
});

export default function JobRoles() {
  const [roles, setRoles] = useState([]);

  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [departmentsLoading, setDepartmentsLoading] = useState(true);

  const [pageError, setPageError] = useState("");

  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [departmentFilter, setDepartmentFilter] = useState("all");

  const [employmentFilter, setEmploymentFilter] = useState("all");

  const [workModeFilter, setWorkModeFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);

  const [editingRole, setEditingRole] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [saving, setSaving] = useState(false);

  const [busyId, setBusyId] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [suggestionSearch, setSuggestionSearch] = useState("");

  const loadRoles = useCallback(async () => {
    setLoading(true);

    setPageError("");

    try {
      const response = await getJobRoles({
        page: 1,

        limit: 100,

        search: search.trim() || undefined,

        status: statusFilter,

        departmentId: departmentFilter === "all" ? undefined : departmentFilter,

        employmentType: employmentFilter === "all" ? undefined : employmentFilter,

        workMode: workModeFilter === "all" ? undefined : workModeFilter,

        sortBy: "title",

        sortOrder: "asc",
      });

      const data = unwrap(response);

      setRoles(Array.isArray(data) ? data : Array.isArray(data?.jobRoles) ? data.jobRoles : []);
    } catch (error) {
      setPageError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, departmentFilter, employmentFilter, workModeFilter]);

  const loadDepartments = useCallback(async () => {
    setDepartmentsLoading(true);

    try {
      const response = await getDepartments({
        page: 1,

        limit: 100,

        status: "active",

        sortBy: "name",

        sortOrder: "asc",
      });

      const data = unwrap(response);

      const list = Array.isArray(data) ? data : Array.isArray(data?.departments) ? data.departments : [];

      setDepartments(list.filter((department) => department.isActive !== false));
    } catch (error) {
      setDepartments([]);

      setNotice(`Could not load departments: ${errorMessage(error)}`);
    } finally {
      setDepartmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const stats = useMemo(
    () => ({
      total: roles.length,

      active: roles.filter((role) => role.isActive).length,

      inactive: roles.filter((role) => !role.isActive).length,

      departments: new Set(roles.map((role) => getId(role.departmentId) || role.departmentId).filter(Boolean)).size,
    }),

    [roles]
  );

  const filteredSuggestions = useMemo(() => {
    const query = suggestionSearch.trim().toLowerCase();

    return ROLE_SUGGESTIONS.map((group) => ({
      ...group,

      roles: group.roles.filter((role) => !query || role.toLowerCase().includes(query) || group.category.toLowerCase().includes(query)),
    })).filter((group) => group.roles.length);
  }, [suggestionSearch]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openCreate = () => {
    setEditingRole(null);

    setForm(EMPTY_FORM);

    setSuggestionSearch("");

    setNotice("");

    setModalOpen(true);
  };

  const openEdit = (role) => {
    setEditingRole(role);

    setForm(toForm(role));

    setSuggestionSearch("");

    setNotice("");

    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);

    setEditingRole(null);

    setForm(EMPTY_FORM);
  };

  const chooseSuggestion = (title) => {
    updateField("title", title);

    setSuggestionSearch("");
  };

  const saveRole = async (event) => {
    event.preventDefault();

    setNotice("");

    if (!form.title.trim() || form.title.trim().length < 2) {
      setNotice("Enter a job title with at least 2 characters.");

      return;
    }

    if (!form.departmentId) {
      setNotice("Select a department. Create a department first if the list is empty.");

      return;
    }

    const minExperience = Number(form.minExperienceYears || 0);

    const maxExperience = form.maxExperienceYears === "" ? null : Number(form.maxExperienceYears);

    const salaryMin = form.salaryMin === "" ? null : Number(form.salaryMin);

    const salaryMax = form.salaryMax === "" ? null : Number(form.salaryMax);

    if (maxExperience !== null && maxExperience < minExperience) {
      setNotice("Maximum experience cannot be lower than minimum experience.");

      return;
    }

    if (salaryMin !== null && salaryMax !== null && salaryMax < salaryMin) {
      setNotice("Maximum salary cannot be lower than minimum salary.");

      return;
    }

    const payload = {
      title: form.title.trim(),

      departmentId: form.departmentId,

      description: form.description.trim(),

      responsibilities: toLines(form.responsibilitiesText),

      requiredSkills: toLines(form.requiredSkillsText),

      preferredSkills: toLines(form.preferredSkillsText),

      minExperienceYears: minExperience,

      maxExperienceYears: maxExperience,

      employmentType: form.employmentType,

      workMode: form.workMode,

      location: form.location.trim(),

      salaryMin,

      salaryMax,

      currency: form.currency,

      isActive: Boolean(form.isActive),
    };

    setSaving(true);

    try {
      if (editingRole) {
        await updateJobRole(getId(editingRole), payload);

        setNotice("Job role updated successfully.");
      } else {
        await createJobRole(payload);

        setNotice("Job role created successfully.");
      }

      setModalOpen(false);

      setEditingRole(null);

      setForm(EMPTY_FORM);

      await loadRoles();
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (role) => {
    const id = getId(role);

    if (!id) return;

    setBusyId(id);

    setNotice("");

    try {
      await setJobRoleStatus(id, !role.isActive);

      setNotice(`Job role ${role.isActive ? "deactivated" : "activated"} successfully.`);

      await loadRoles();
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setBusyId("");
    }
  };

  const removeRole = async () => {
    if (!deleteTarget) return;

    const id = getId(deleteTarget);

    setBusyId(id);

    setNotice("");

    try {
      await deleteJobRole(id);

      setNotice("Job role deactivated successfully.");

      setDeleteTarget(null);

      await loadRoles();
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setBusyId("");
    }
  };

  const resetFilters = () => {
    setSearch("");

    setStatusFilter("all");

    setDepartmentFilter("all");

    setEmploymentFilter("all");

    setWorkModeFilter("all");
  };

  return (
    <div className="jr-page">
      <style>{`
  /* Theme tokens: default light mode */
  .jr-page{--bg:#f5f7fb;--surface:#ffffff;--surface-2:#f8fafc;--text:#182230;--muted:#657286;--border:#e2e8f0;--primary:#5847e8;--primary-soft:#edf2ff;--success:#137a50;--success-soft:#e9f8f0;--danger:#b42332;--danger-soft:#fff0f1;--shadow:0 2px 8px rgba(16,24,40,.04);color:var(--text);background:var(--bg)}
  /* Follow common ThemeContext root attributes/classes when dark mode is selected */
  :is(html[data-theme="dark"],body[data-theme="dark"],html.dark,body.dark,[data-theme="dark"],.dark) .jr-page,
  .jr-page:is([data-theme="dark"],.dark){--bg:#0f1420;--surface:#191f2e;--surface-2:#20283a;--text:#eef2ff;--muted:#a2abc3;--border:#2b3449;--primary:#8b7cff;--primary-soft:rgba(101,86,232,.18);--success:#54d99e;--success-soft:rgba(38,181,120,.14);--danger:#ff9292;--danger-soft:rgba(220,90,90,.14);--shadow:0 2px 10px rgba(0,0,0,.16);color:var(--text);background:var(--bg)}
  .jr-page{color-scheme:light}
  :is(html[data-theme="dark"],body[data-theme="dark"],html.dark,body.dark,[data-theme="dark"],.dark) .jr-page,
  .jr-page:is([data-theme="dark"],.dark){color-scheme:dark}


  .jr-page{color:var(--text,#182230);background:var(--bg,#f5f7fb);width:100%;min-width:0;padding:24px;box-sizing:border-box;font-size:14px}

  .jr-page *{box-sizing:border-box}

  .jr-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin:0 0 24px;flex-wrap:wrap}

  .jr-eyebrow{display:none}

  .jr-title{font-size:28px;line-height:1.2;font-weight:600;margin:0;color:var(--text,#182230)}

  .jr-subtitle{margin:8px 0 0;color:var(--muted,#657286);line-height:1.65;max-width:680px}

  .jr-btn{border:1px solid var(--border,#e2e8f0);border-radius:10px;padding:10px 13px;display:inline-flex;align-items:center;justify-content:center;gap:8px;font:inherit;font-weight:500;cursor:pointer;transition:background .15s,border-color .15s,color .15s;color:var(--text,#182230);background:var(--surface,#fff);white-space:nowrap}

  .jr-btn:disabled{opacity:.55;cursor:not-allowed}

  .jr-btn:hover:not(:disabled){border-color:#6556e8;background:var(--surface-2,#f8fafc)}

  .jr-primary{background:#5847e8;border-color:#5847e8;color:#fff}

  .jr-primary:hover:not(:disabled){background:#4837d2;border-color:#4837d2;color:#fff}

  .jr-danger{color:var(--danger,#b42332);border-color:var(--border,#e2e8f0)}

  .jr-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}

  .jr-stat,.jr-panel{background:var(--surface,#fff);border:1px solid var(--border,#e2e8f0);border-radius:14px;box-shadow:var(--shadow,0 2px 8px rgba(16,24,40,.04))}

  .jr-stat{padding:16px;min-width:0}

  .jr-stat-top{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--muted,#657286);font-size:12px}

  .jr-stat-number{font-size:27px;font-weight:600;margin-top:11px;color:var(--text,#182230);overflow-wrap:anywhere}

  .jr-stat-icon{width:34px;height:34px;border-radius:10px;background:var(--primary-soft,#edf2ff);color:var(--primary,#5847e8);display:grid;place-items:center;flex-shrink:0}

  .jr-panel{padding:16px;margin-bottom:16px;min-width:0}

  .jr-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:15px}

  .jr-search{position:relative;display:flex;align-items:center;gap:9px;min-width:200px;flex:1;color:var(--muted,#657286);border:1px solid var(--border,#e2e8f0);border-radius:10px;padding:0 11px;background:var(--surface,#fff);height:42px}

  .jr-search:focus-within{border-color:var(--primary,#5847e8);box-shadow:0 0 0 3px var(--primary-soft,#edf2ff)}

  .jr-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:var(--text,#182230);font:inherit}

  .jr-search input::placeholder,.jr-input::placeholder,.jr-textarea::placeholder{color:var(--muted,#657286);opacity:.85}

  .jr-search button{border:0;background:transparent;color:var(--muted,#657286);padding:3px;display:grid;place-items:center;cursor:pointer}

  .jr-select,.jr-input,.jr-textarea{width:100%;min-width:0;border:1px solid var(--border,#e2e8f0);border-radius:9px;padding:10px 11px;background:var(--surface,#fff);color:var(--text,#182230);font:inherit;outline:none}

  .jr-select{color-scheme:light}

  html[data-theme="dark"] .jr-select{color-scheme:dark}

  .jr-select:focus,.jr-input:focus,.jr-textarea:focus{border-color:var(--primary,#5847e8);box-shadow:0 0 0 3px var(--primary-soft,#edf2ff)}

  .jr-toolbar>.jr-select{width:auto;min-width:145px;max-width:190px;height:42px}

  .jr-table-wrap{width:100%;overflow-x:auto;border-radius:10px}

  .jr-table{width:100%;border-collapse:collapse;min-width:900px;text-align:left;background:var(--surface,#fff)}

  .jr-table th{font-size:11px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;color:var(--muted,#657286);padding:12px;border-bottom:1px solid var(--border,#e2e8f0);background:var(--surface-2,#f8fafc);white-space:nowrap}

  .jr-table td{padding:14px 12px;border-bottom:1px solid var(--border,#e2e8f0);vertical-align:middle;color:var(--text,#182230)}

  .jr-table tbody tr{background:var(--surface,#fff);transition:background .15s}

  .jr-table tbody tr:hover{background:var(--surface-2,#f8fafc)}

  .jr-table tbody tr:last-child td{border-bottom:0}

  .jr-role-name{font-weight:500;color:var(--text,#182230);margin-bottom:5px}

  .jr-secondary{color:var(--muted,#657286);font-size:12px;line-height:1.5}

  .jr-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:500;white-space:nowrap}

  .jr-active{background:var(--success-soft,#e9f8f0);color:var(--success,#137a50)}

  .jr-inactive{background:var(--danger-soft,#fff0f1);color:var(--danger,#b42332)}

  .jr-actions{display:flex;gap:6px;align-items:center}

  .jr-icon-btn{width:33px;height:33px;padding:0;border:1px solid var(--border,#e2e8f0);background:var(--surface,#fff);color:var(--muted,#657286);border-radius:8px;display:grid;place-items:center;cursor:pointer;transition:background .15s,border-color .15s,color .15s}

  .jr-icon-btn:hover{border-color:var(--primary,#6556e8);color:var(--primary,#5847e8);background:var(--surface-2,#f8fafc)}

  .jr-icon-btn:disabled{opacity:.5;cursor:not-allowed}

  .jr-empty{padding:40px 18px;text-align:center;color:var(--muted,#657286);display:flex;align-items:center;flex-direction:column;gap:10px;background:var(--surface,#fff)}

  .jr-empty strong{color:var(--text,#182230)}

  .jr-state{padding:14px;border:1px solid var(--border,#e2e8f0);border-radius:10px;color:var(--muted,#657286);background:var(--surface,#fff);display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}

  .jr-notice{padding:11px 13px;border-radius:9px;margin-bottom:14px;background:var(--primary-soft,#edf2ff);border:1px solid var(--border,#e2e8f0);color:var(--text,#182230);line-height:1.5;overflow-wrap:anywhere}

  .jr-error{background:var(--danger-soft,#fff0f1);border-color:var(--danger,#b42332);color:var(--danger,#b42332)}

  .jr-modal-backdrop{position:fixed;inset:0;z-index:1000;background:rgba(4,6,14,.58);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:18px;overflow-y:auto}

  .jr-modal{width:min(880px,100%);max-height:calc(100dvh - 36px);overflow-y:auto;background:var(--surface,#fff);color:var(--text,#182230);border:1px solid var(--border,#e2e8f0);border-radius:16px;box-shadow:0 22px 80px rgba(0,0,0,.2);overscroll-behavior:contain}

  .jr-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;padding:20px 22px;border-bottom:1px solid var(--border,#e2e8f0);position:sticky;top:0;background:var(--surface,#fff);color:var(--text,#182230);z-index:2}

  .jr-modal-head h2{font-size:19px;font-weight:600;margin:0;color:var(--text,#182230)}

  .jr-modal-head p{margin:6px 0 0;color:var(--muted,#657286);font-size:12px;line-height:1.5}

  .jr-form{padding:20px 22px}

  .jr-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}

  .jr-field{display:flex;flex-direction:column;gap:7px;min-width:0}

  .jr-field label{font-size:12px;font-weight:500;color:var(--text,#182230)}

  .jr-field small{color:var(--muted,#657286);font-size:11px;line-height:1.5}

  .jr-span-2{grid-column:1/-1}

  .jr-textarea{resize:vertical;min-height:95px;line-height:1.5}

  .jr-checkbox-row{display:flex;align-items:center;gap:9px;border:1px solid var(--border,#e2e8f0);border-radius:9px;padding:11px 12px;background:var(--surface,#fff);color:var(--text,#182230)}

  .jr-checkbox-row input{accent-color:var(--primary,#6556e8);width:16px;height:16px;flex-shrink:0}

  .jr-suggestions{border:1px solid var(--border,#e2e8f0);border-radius:10px;padding:12px;margin-top:10px;background:var(--surface,#fff)}

  .jr-suggestion-group+.jr-suggestion-group{margin-top:12px}

  .jr-suggestion-group strong{font-size:11px;color:var(--muted,#657286);font-weight:500;display:block;margin-bottom:7px}

  .jr-suggestion-chips{display:flex;flex-wrap:wrap;gap:6px}

  .jr-chip{border:1px solid var(--border,#e2e8f0);background:var(--surface,#fff);color:var(--text,#182230);border-radius:999px;padding:6px 9px;font:inherit;font-size:11px;cursor:pointer;transition:background .15s,border-color .15s}

  .jr-chip:hover{border-color:var(--primary,#6556e8);background:var(--primary-soft,#edf2ff)}

  .jr-modal-footer{display:flex;justify-content:flex-end;gap:9px;flex-wrap:wrap;padding:15px 22px;border-top:1px solid var(--border,#e2e8f0);position:sticky;bottom:0;background:var(--surface,#fff);z-index:2}

  .jr-modal-footer .jr-btn{min-width:105px}

  .jr-confirm{width:min(440px,100%);padding:22px}

  .jr-confirm h3{margin:0 0 8px;font-size:18px;font-weight:600;color:var(--text,#182230)}

  .jr-confirm p{margin:0 0 18px;color:var(--muted,#657286);line-height:1.6}

  @media(max-width:1100px){.jr-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.jr-toolbar>.jr-select{flex:1;max-width:none}}

  @media(max-width:900px){.jr-page{padding:20px}.jr-modal{max-height:calc(100dvh - 24px)}.jr-form{padding:18px}}

  @media(max-width:600px){.jr-page{padding:14px}.jr-head{margin-bottom:16px;gap:12px}.jr-title{font-size:24px}.jr-subtitle{font-size:13px}.jr-head>div:last-child{width:100%}.jr-head>div:last-child .jr-btn{flex:1}.jr-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.jr-stat{padding:12px}.jr-stat-number{font-size:23px}.jr-stat-top{font-size:11px}.jr-stat-icon{width:30px;height:30px}.jr-panel{padding:11px}.jr-toolbar{gap:8px}.jr-search{flex:1 1 100%;min-width:0}.jr-toolbar>.jr-select{flex:1 1 100%;width:100%;max-width:none;min-width:0}.jr-table{min-width:900px}.jr-modal-backdrop{padding:8px;align-items:flex-start}.jr-modal{max-height:calc(100dvh - 16px);border-radius:12px}.jr-modal-head{padding:15px}.jr-form{padding:15px}.jr-modal-footer{padding:12px 15px}.jr-form-grid{grid-template-columns:1fr;gap:13px}.jr-span-2{grid-column:auto}.jr-confirm{padding:18px}.jr-modal-footer .jr-btn{flex:1}.jr-state{align-items:flex-start}}

  @media(prefers-reduced-motion:reduce){.jr-btn,.jr-icon-btn,.jr-table tbody tr,.jr-chip{transition:none}}

`}</style>

      <header className="jr-head">
        <div>
          <h1 className="jr-title">Job Roles</h1>

          <p className="jr-subtitle">Create and manage hiring roles, define requirements, and control which roles are available on public application forms.</p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="jr-btn"
            onClick={() => {
              loadRoles();

              loadDepartments();
            }}
            disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </button>

          <button className="jr-btn jr-primary" onClick={openCreate}>
            <Plus size={16} /> Create Job Role
          </button>
        </div>
      </header>

      {pageError && (
        <div className="jr-notice jr-error" role="alert" style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <span>{pageError}</span>

          <button className="jr-btn" onClick={loadRoles}>
            Try again
          </button>
        </div>
      )}

      {notice && !modalOpen && (
        <div className="jr-notice" role="status">
          {notice}
        </div>
      )}

      <section className="jr-stats">
        {[
          { label: "Total roles", value: stats.total, icon: BriefcaseBusiness },

          { label: "Active roles", value: stats.active, icon: CheckCircle2 },

          { label: "Inactive roles", value: stats.inactive, icon: XCircle },

          { label: "Departments used", value: stats.departments, icon: Building2 },
        ].map(({ label, value, icon: Icon }) => (
          <div className="jr-stat" key={label}>
            <div className="jr-stat-top">
              <span>{label}</span>

              <span className="jr-stat-icon">
                <Icon size={17} />
              </span>
            </div>

            <div className="jr-stat-number">{value}</div>
          </div>
        ))}
      </section>

      <section className="jr-panel">
        <div className="jr-toolbar">
          <label className="jr-search">
            <Search size={17} />

            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search job title, location, department..." />

            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
                <X size={16} />
              </button>
            )}
          </label>

          <select className="jr-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option>

            <option value="active">Active</option>

            <option value="inactive">Inactive</option>
          </select>

          <select className="jr-select" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} aria-label="Filter by department">
            <option value="all">All departments</option>

            {departments.map((department) => (
              <option key={getId(department)} value={getId(department)}>
                {department.name}
              </option>
            ))}
          </select>

          <select className="jr-select" value={employmentFilter} onChange={(event) => setEmploymentFilter(event.target.value)} aria-label="Filter by employment type">
            <option value="all">All employment types</option>

            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <select className="jr-select" value={workModeFilter} onChange={(event) => setWorkModeFilter(event.target.value)} aria-label="Filter by work mode">
            <option value="all">All work modes</option>

            {WORK_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>

          <button className="jr-btn" onClick={resetFilters}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        {loading ? (
          <div className="jr-state">
            <span>Loading job roles...</span>

            <RefreshCw size={16} />
          </div>
        ) : (
          <div className="jr-table-wrap">
            <table className="jr-table">
              <thead>
                <tr>
                  <th>Job role</th>

                  <th>Department</th>

                  <th>Employment</th>

                  <th>Work mode</th>

                  <th>Experience</th>

                  <th>Salary range</th>

                  <th>Status</th>

                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {roles.map((role) => {
                  const id = getId(role);

                  const department = departments.find((item) => getId(item) === (getId(role.departmentId) || role.departmentId)) || (typeof role.departmentId === "object" ? role.departmentId : null);

                  return (
                    <tr key={id}>
                      <td>
                        <div className="jr-role-name">{role.title}</div>

                        <div className="jr-secondary">{role.location || "Location not specified"}</div>
                      </td>

                      <td>{department?.name || "—"}</td>

                      <td>{titleCase(role.employmentType)}</td>

                      <td>{titleCase(role.workMode)}</td>

                      <td>{role.maxExperienceYears == null ? `${role.minExperienceYears || 0}+ years` : `${role.minExperienceYears || 0}–${role.maxExperienceYears} years`}</td>

                      <td>{role.salaryMin == null && role.salaryMax == null ? "Not specified" : `${formatMoney(role.salaryMin, role.currency) || "—"} – ${formatMoney(role.salaryMax, role.currency) || "—"}`}</td>

                      <td>
                        <span className={`jr-badge ${role.isActive ? "jr-active" : "jr-inactive"}`}>
                          {role.isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}

                          {role.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div className="jr-actions">
                          <button className="jr-icon-btn" title="Edit job role" aria-label="Edit job role" onClick={() => openEdit(role)}>
                            <Pencil size={15} />
                          </button>

                          <button className="jr-icon-btn" title={role.isActive ? "Deactivate role" : "Activate role"} aria-label={role.isActive ? "Deactivate role" : "Activate role"} disabled={busyId === id} onClick={() => toggleStatus(role)}>
                            {role.isActive ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                          </button>

                          <button className="jr-icon-btn" title="Delete / deactivate role" aria-label="Delete job role" disabled={busyId === id} onClick={() => setDeleteTarget(role)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!roles.length && (
              <div className="jr-empty">
                <BriefcaseBusiness size={29} />

                <strong>No job roles found</strong>

                <span>Create your first job role or change the filters.</span>

                <button className="jr-btn jr-primary" onClick={openCreate}>
                  <Plus size={15} /> Create Job Role
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {modalOpen && (
        <div
          className="jr-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}>
          <section className="jr-modal" role="dialog" aria-modal="true" aria-labelledby="jr-modal-title">
            <header className="jr-modal-head">
              <div>
                <h2 id="jr-modal-title">{editingRole ? "Edit Job Role" : "Create Job Role"}</h2>

                <p>Define the role details and requirements used by your recruitment team.</p>
              </div>

              <button className="jr-icon-btn" onClick={closeModal} aria-label="Close dialog">
                <X size={17} />
              </button>
            </header>

            <form className="jr-form" onSubmit={saveRole}>
              {notice && (
                <div className="jr-notice jr-error" role="alert">
                  {notice}
                </div>
              )}

              {!departmentsLoading && departments.length === 0 && <div className="jr-notice jr-error">No active departments found. Open Departments and create an active department first.</div>}

              <div className="jr-form-grid">
                <div className="jr-field jr-span-2">
                  <label htmlFor="jr-title">Job title \\*</label>

                  <input id="jr-title" className="jr-input" value={form.title} onChange={(event) => updateField("title", event.target.value)} maxLength={120} required placeholder="e.g. Software Engineer" />

                  <small>Use a clear, searchable title. You can also choose from common role suggestions below.</small>

                  <div className="jr-suggestions">
                    <label className="jr-field">
                      <span>Find a suggested job title</span>

                      <input className="jr-input" value={suggestionSearch} onChange={(event) => setSuggestionSearch(event.target.value)} placeholder="Search roles, e.g. developer, HR, accountant" />
                    </label>

                    <div style={{ maxHeight: 190, overflowY: "auto", marginTop: 12 }}>
                      {filteredSuggestions.length ? (
                        filteredSuggestions.map((group) => (
                          <div className="jr-suggestion-group" key={group.category}>
                            <strong>{group.category}</strong>

                            <div className="jr-suggestion-chips">
                              {group.roles.map((title) => (
                                <button type="button" className="jr-chip" key={title} onClick={() => chooseSuggestion(title)}>
                                  {title}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="jr-secondary">No matching suggestions. You can type any custom title above.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="jr-field">
                  <label htmlFor="jr-department">Department \\*</label>

                  <select id="jr-department" className="jr-select" value={form.departmentId} onChange={(event) => updateField("departmentId", event.target.value)} required disabled={departmentsLoading}>
                    <option value="">{departmentsLoading ? "Loading departments..." : "Select department"}</option>

                    {departments.map((department) => (
                      <option key={getId(department)} value={getId(department)}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="jr-field">
                  <label htmlFor="jr-employment">Employment type \\*</label>

                  <select id="jr-employment" className="jr-select" value={form.employmentType} onChange={(event) => updateField("employmentType", event.target.value)}>
                    {EMPLOYMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="jr-field">
                  <label htmlFor="jr-workmode">Work mode \\*</label>

                  <select id="jr-workmode" className="jr-select" value={form.workMode} onChange={(event) => updateField("workMode", event.target.value)}>
                    {WORK_MODES.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="jr-field">
                  <label htmlFor="jr-location">Location</label>

                  <input id="jr-location" className="jr-input" value={form.location} onChange={(event) => updateField("location", event.target.value)} maxLength={200} placeholder="e.g. Bengaluru, Karnataka" />
                </div>

                <div className="jr-field">
                  <label htmlFor="jr-min-exp">Minimum experience (years)</label>

                  <input id="jr-min-exp" className="jr-input" type="number" min="0" max="60" value={form.minExperienceYears} onChange={(event) => updateField("minExperienceYears", event.target.value)} />
                </div>

                <div className="jr-field">
                  <label htmlFor="jr-max-exp">Maximum experience (years)</label>

                  <input id="jr-max-exp" className="jr-input" type="number" min={form.minExperienceYears || 0} max="60" value={form.maxExperienceYears} onChange={(event) => updateField("maxExperienceYears", event.target.value)} placeholder="No maximum" />
                </div>

                <div className="jr-field">
                  <label htmlFor="jr-currency">Salary currency</label>

                  <select id="jr-currency" className="jr-select" value={form.currency} onChange={(event) => updateField("currency", event.target.value)}>
                    <option value="INR">INR (₹)</option>

                    <option value="USD">USD ($)</option>

                    <option value="EUR">EUR (€)</option>

                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div className="jr-field">
                  <label htmlFor="jr-min-salary">Minimum salary (annual)</label>

                  <input id="jr-min-salary" className="jr-input" type="number" min="0" value={form.salaryMin} onChange={(event) => updateField("salaryMin", event.target.value)} placeholder="e.g. 400000" />
                </div>

                <div className="jr-field">
                  <label htmlFor="jr-max-salary">Maximum salary (annual)</label>

                  <input id="jr-max-salary" className="jr-input" type="number" min="0" value={form.salaryMax} onChange={(event) => updateField("salaryMax", event.target.value)} placeholder="e.g. 900000" />
                </div>

                <div className="jr-field jr-span-2">
                  <label htmlFor="jr-description">Job description</label>

                  <textarea id="jr-description" className="jr-textarea" maxLength={5000} value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Describe the role, its purpose, team, and expectations..." />

                  <small>Maximum 5,000 characters.</small>
                </div>

                <div className="jr-field jr-span-2">
                  <label htmlFor="jr-responsibilities">Key responsibilities</label>

                  <textarea
                    id="jr-responsibilities"
                    className="jr-textarea"
                    value={form.responsibilitiesText}
                    onChange={(event) => updateField("responsibilitiesText", event.target.value)}
                    placeholder={"Manage assigned work and deliverables\nCollaborate with the team\nReport progress and resolve issues"}
                  />

                  <small>Enter one responsibility per line (up to 30).</small>
                </div>

                <div className="jr-field jr-span-2">
                  <label htmlFor="jr-required-skills">Required skills</label>

                  <textarea id="jr-required-skills" className="jr-textarea" value={form.requiredSkillsText} onChange={(event) => updateField("requiredSkillsText", event.target.value)} placeholder="JavaScript, React, Problem solving" />

                  <small>Separate skills with commas or new lines (up to 50).</small>
                </div>

                <div className="jr-field jr-span-2">
                  <label htmlFor="jr-preferred-skills">Preferred skills</label>

                  <textarea id="jr-preferred-skills" className="jr-textarea" value={form.preferredSkillsText} onChange={(event) => updateField("preferredSkillsText", event.target.value)} placeholder="TypeScript, Testing, Cloud deployment" />

                  <small>These are helpful skills, not mandatory requirements.</small>
                </div>

                <div className="jr-field jr-span-2">
                  <label className="jr-checkbox-row">
                    <input type="checkbox" checked={form.isActive} onChange={(event) => updateField("isActive", event.target.checked)} />

                    <span>Active role — available for public application forms</span>
                  </label>
                </div>
              </div>
            </form>

            <footer className="jr-modal-footer">
              <button type="button" className="jr-btn" onClick={closeModal} disabled={saving}>
                Cancel
              </button>

              <button type="button" className="jr-btn jr-primary" onClick={() => document.querySelector(".jr-form")?.requestSubmit()} disabled={saving || departmentsLoading || departments.length === 0}>
                {saving ? <RefreshCw size={15} /> : <Save size={15} />}

                {saving ? "Saving..." : editingRole ? "Save Changes" : "Create Job Role"}
              </button>
            </footer>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div
          className="jr-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busyId) setDeleteTarget(null);
          }}>
          <section className="jr-modal jr-confirm" role="dialog" aria-modal="true" aria-labelledby="jr-delete-title">
            <h3 id="jr-delete-title">Deactivate this job role?</h3>

            <p>“{deleteTarget.title}” will be deactivated through the backend. It may no longer appear in the public application form. Existing application history is not intentionally deleted by this action.</p>

            <div className="jr-actions" style={{ justifyContent: "flex-end" }}>
              <button className="jr-btn" onClick={() => setDeleteTarget(null)} disabled={Boolean(busyId)}>
                Cancel
              </button>

              <button className="jr-btn jr-danger" onClick={removeRole} disabled={Boolean(busyId)}>
                <Trash2 size={15} /> {busyId ? "Working..." : "Deactivate role"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
