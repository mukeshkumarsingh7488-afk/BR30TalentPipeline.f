import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FileText, LoaderCircle, UploadCloud, BriefcaseBusiness, MapPin, Clock3, IndianRupee, LockKeyhole, ChevronDown, GraduationCap, FolderKanban, UserRound, Wallet, Link2 } from "lucide-react";
import { getPublicForm, getPublicJobRoles, submitPublicApplication } from "../../api/public-form.api.js";

const dataOf = (response) => response?.data?.data ?? response?.data ?? response;
const messageOf = (error) => error?.response?.data?.message || error?.response?.data?.error || error?.message || "Unable to submit the application. Please try again.";
const getId = (item) => String(item?._id || item?.id || "");

const emptyEducation = () => ({
  qualification: "",
  institution: "",
  fieldOfStudy: "",
  graduationYear: "",
  grade: "",
});
const emptyProject = () => ({
  name: "",
  description: "",
  url: "",
  technologies: "",
});
const emptyValues = () => ({
  fullName: "",
  email: "",
  mobile: "",
  location: "",
  experienceYears: "0",
  currentCompany: "",
  currentJobTitle: "",
  employmentStatus: "",
  currentCtc: "",
  expectedCtc: "",
  noticePeriodDays: "",
  skills: "",
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
  coverLetter: "",
  expectedSalary: "",
  education: [emptyEducation()],
  projects: [emptyProject()],
});

const formatValue = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatSalary = (minimum, maximum, currency = "INR") => {
  if (minimum == null && maximum == null) return "Not specified";
  try {
    const formatter = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    });
    if (minimum != null && maximum != null) return `${formatter.format(minimum)} - ${formatter.format(maximum)}`;
    if (minimum != null) return `From ${formatter.format(minimum)}`;
    return `Up to ${formatter.format(maximum)}`;
  } catch {
    return [minimum, maximum].filter((value) => value != null).join(" - ");
  }
};

const isValidHttpUrl = (value) => {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const getRoleList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.jobRoles)) return payload.jobRoles;
  if (Array.isArray(payload?.roles)) return payload.roles;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const SectionHeading = ({ icon: Icon, title, subtitle }) => (
  <div className="pub-section-heading">
    <span className="pub-section-icon">
      <Icon size={17} />
    </span>
    <div>
      <h2 className="pub-section-title">{title}</h2>
      {subtitle && <p className="pub-section-subtitle">{subtitle}</p>}
    </div>
  </div>
);

export default function PublicApplicationForm() {
  const { publicId } = useParams();
  const isUniversal = !publicId;

  const [form, setForm] = useState(null);
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [resume, setResume] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [values, setValues] = useState(emptyValues);

  const filteredRoles = useMemo(() => {
    const query = roleSearch.trim().toLowerCase();
    return roles.filter((role) => !query || `${role.title || ""} ${role.departmentId?.name || role.department?.name || ""}`.toLowerCase().includes(query));
  }, [roles, roleSearch]);

  const selectedRole = useMemo(() => roles.find((role) => getId(role) === selectedRoleId) || null, [roles, selectedRoleId]);

  const currentRole = isUniversal
    ? selectedRole
    : form
      ? {
          _id: typeof form.jobRoleId === "object" ? getId(form.jobRoleId) : form.jobRoleId,
          title: form.jobRole || form.jobRoleId?.title,
          description: form.jobRoleDescription || "",
          departmentId: { name: form.department || form.departmentId?.name || "" },
          responsibilities: [],
          requiredSkills: [],
          preferredSkills: [],
          minExperienceYears: 0,
          maxExperienceYears: null,
          employmentType: "",
          workMode: "",
          location: "",
          salaryMin: null,
          salaryMax: null,
          currency: "INR",
        }
      : null;

  const roleSelected = Boolean(getId(currentRole));
  const allowCoverLetter = isUniversal ? true : form?.allowCoverLetter !== false;
  const allowProfileImage = isUniversal ? true : form?.allowProfileImage !== false;
  const roleTitle = currentRole?.title || "";
  const titleLower = roleTitle.toLowerCase();

  const roleCategory = useMemo(() => {
    if (/design|creative|graphic|video|photograph|motion|brand/.test(titleLower)) return "creative";
    if (/software|frontend|backend|full stack|react|node|engineer|developer|devops|cloud|cybersecurity|qa|automation|data scientist|data analyst|technical|it support/.test(titleLower)) return "technology";
    if (/sales|business development|marketing|seo|social media|content|telecaller|account manager|inside sales/.test(titleLower)) return "sales";
    if (/hr|recruit|talent acquisition|payroll|people/.test(titleLower)) return "hr";
    if (/finance|accountant|accounts payable|accounts receivable|tax|audit|billing/.test(titleLower)) return "finance";
    if (/customer|support|helpdesk|relationship/.test(titleLower)) return "support";
    if (/operation|logistics|supply chain|warehouse|inventory|delivery|fleet|procurement/.test(titleLower)) return "operations";
    if (/project manager|program manager|product manager|business analyst/.test(titleLower)) return "management";
    return "general";
  }, [titleLower]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      setForm(null);
      setRoles([]);
      setSelectedRoleId("");
      setResult(null);
      try {
        if (isUniversal) {
          const response = await getPublicJobRoles();
          const list = getRoleList(dataOf(response));
          if (active) setRoles(list.filter((role) => role?.isActive !== false && getId(role) && role?.title));
        } else {
          const response = await getPublicForm(publicId);
          const payload = dataOf(response);
          const publicForm = payload?.publicForm || payload?.form || payload;
          if (active) {
            setForm(publicForm);
            setSelectedRoleId(String(typeof publicForm?.jobRoleId === "object" ? getId(publicForm.jobRoleId) : publicForm?.jobRoleId || ""));
          }
        }
      } catch (loadError) {
        if (active) setError(messageOf(loadError));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [publicId, isUniversal]);

  const change = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const changeNested = (collection, index, field, value) => {
    setValues((current) => ({
      ...current,
      [collection]: current[collection].map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  };

  const addNested = (collection, factory, maximum) => {
    setValues((current) => (current[collection].length >= maximum ? current : { ...current, [collection]: [...current[collection], factory()] }));
  };

  const removeNested = (collection, index) => {
    setValues((current) => ({
      ...current,
      [collection]: current[collection].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const selectRole = (event) => {
    setSelectedRoleId(event.target.value);
    setValues(emptyValues());
    setResume(null);
    setProfileImage(null);
    setError("");
    setResult(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!roleSelected) return setError("Please select a job role before continuing.");
    if (values.fullName.trim().length < 2) return setError("Please enter your full name.");
    if (!values.email.trim()) return setError("Please enter your email address.");
    if (values.mobile.trim().length < 7) return setError("Please enter a valid mobile number.");

    if (![values.linkedinUrl, values.githubUrl, values.portfolioUrl].every(isValidHttpUrl)) {
      return setError("Please enter valid LinkedIn, GitHub and portfolio URLs.");
    }
    for (const education of values.education) {
      if (education.graduationYear && (!/^\d{4}$/.test(education.graduationYear) || Number(education.graduationYear) < 1950 || Number(education.graduationYear) > new Date().getFullYear() + 10)) {
        return setError("Please enter a valid graduation year.");
      }
    }
    for (const project of values.projects) {
      if (project.url && !isValidHttpUrl(project.url)) return setError("Please enter a valid project URL.");
    }
    if (!resume) return setError("Please attach your resume in PDF format.");
    if (resume.type !== "application/pdf" || !resume.name.toLowerCase().endsWith(".pdf")) {
      return setError("Resume must be a PDF file.");
    }
    if (resume.size > 5 * 1024 * 1024) return setError("Resume must be 5 MB or smaller.");
    if (profileImage) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(profileImage.type)) {
        return setError("Profile image must be JPG, PNG or WebP.");
      }
      if (profileImage.size > 2 * 1024 * 1024) return setError("Profile image must be 2 MB or smaller.");
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      if (!isUniversal) body.append("publicFormId", publicId);
      body.append("jobRoleId", getId(currentRole));
      body.append("fullName", values.fullName.trim());
      body.append("email", values.email.trim());
      body.append("mobile", values.mobile.trim());
      body.append("location", values.location.trim());
      body.append("experienceYears", values.experienceYears || "0");
      body.append("currentCompany", values.currentCompany.trim());
      body.append("currentJobTitle", values.currentJobTitle.trim());
      body.append("employmentStatus", values.employmentStatus);
      body.append("currentCtc", values.currentCtc || "");
      body.append("expectedCtc", values.expectedCtc || "");
      body.append("noticePeriodDays", values.noticePeriodDays || "");
      body.append(
        "skills",
        JSON.stringify(
          values.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean)
        )
      );
      body.append(
        "education",
        JSON.stringify(
          values.education
            .filter((item) => Object.values(item).some((value) => String(value).trim()))
            .map((item) => ({
              qualification: item.qualification.trim(),
              institution: item.institution.trim(),
              fieldOfStudy: item.fieldOfStudy.trim(),
              graduationYear: item.graduationYear ? Number(item.graduationYear) : undefined,
              grade: item.grade.trim(),
            }))
        )
      );
      body.append(
        "projects",
        JSON.stringify(
          values.projects
            .filter((item) => item.name.trim() || item.description.trim() || item.url.trim() || item.technologies.trim())
            .map((item) => ({
              name: item.name.trim(),
              description: item.description.trim(),
              url: item.url.trim(),
              technologies: item.technologies
                .split(",")
                .map((technology) => technology.trim())
                .filter(Boolean),
            }))
        )
      );
      body.append("linkedinUrl", values.linkedinUrl.trim());
      body.append("githubUrl", values.githubUrl.trim());
      body.append("portfolioUrl", values.portfolioUrl.trim());
      body.append("coverLetter", allowCoverLetter ? values.coverLetter.trim() : "");
      body.append("expectedSalary", values.expectedSalary || values.expectedCtc || "");
      body.append("salaryCurrency", currentRole?.currency || "INR");
      body.append("resume", resume);
      if (allowProfileImage && profileImage) body.append("profileImage", profileImage);
      const response = await submitPublicApplication(body);
      setResult(dataOf(response));
    } catch (submitError) {
      setError(messageOf(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const resetApplication = () => {
    setValues(emptyValues());
    setResume(null);
    setProfileImage(null);
    setResult(null);
    setError("");
  };

  const skillLabel = {
    technology: "Technical skills",
    creative: "Design and creative skills",
    sales: "Sales and marketing skills",
    support: "Customer support skills",
    finance: "Finance and accounting skills",
    hr: "HR and recruitment skills",
    operations: "Operations and logistics skills",
    management: "Management and business skills",
    general: "Relevant skills",
  }[roleCategory];

  const skillPlaceholder = {
    technology: "JavaScript, React, Node.js, SQL",
    creative: "Figma, Photoshop, Illustrator",
    sales: "Lead generation, SEO, CRM",
    support: "Communication, ticketing tools",
    finance: "Accounting, Excel, financial reporting",
    hr: "Recruitment, HRMS, payroll",
    operations: "Operations, logistics, inventory",
    management: "Project planning, analysis, leadership",
    general: "Enter skills separated by commas",
  }[roleCategory];

  const disabled = !roleSelected || submitting;

  return (
    <div className="public-form-page">
      <style>{`
.public-form-page{box-sizing:border-box;--pub-bg:#fff;--pub-card:#fff;--pub-text:#171717;--pub-muted:#666;--pub-border:#e2e2e2;min-height:100vh;width:100%;padding:30px 18px 44px;background:#fff!important;color:#171717!important;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color-scheme:light;overflow-x:hidden}
.public-form-page *{box-sizing:border-box}.public-form-page button,.public-form-page input,.public-form-page select,.public-form-page textarea{color-scheme:light}.pub-wrap{width:100%;max-width:820px;margin:0 auto}.pub-brand{display:flex;align-items:center;gap:10px;margin:0 0 20px;font-size:14px;font-weight:500;color:#171717}.pub-logo{display:block;width:38px;height:38px;object-fit:contain;border:1px solid #e5e5e5;border-radius:8px;padding:4px;background:#fff}.pub-card{width:100%;background:#fff!important;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.035)}.pub-hero{padding:26px 30px;background:#fff!important;color:#171717!important;border-bottom:1px solid #e5e5e5}.pub-hero h1{font-size:27px;line-height:1.3;margin:0 0 8px;font-weight:500;color:#171717}.pub-hero p{margin:0;line-height:1.7;font-size:14px;color:#666;white-space:pre-wrap;overflow-wrap:anywhere}.pub-job{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.pub-job span{padding:6px 9px;border-radius:5px;background:#f7f7f7;color:#333;border:1px solid #e7e7e7;font-size:12px}.pub-body{padding:28px 30px;background:#fff;color:#171717}.pub-section{padding:0 0 27px;margin:0 0 27px;border-bottom:1px solid #ededed}.pub-section:last-of-type{border-bottom:0;padding-bottom:0;margin-bottom:0}.pub-section-heading{display:flex;align-items:flex-start;gap:11px;margin-bottom:19px}.pub-section-icon{display:grid;place-items:center;width:34px;height:34px;flex:0 0 34px;border:1px solid #e6e6e6;border-radius:8px;color:#444;background:#fafafa}.pub-section-title{font-size:16px;font-weight:500;margin:1px 0 4px;color:#171717}.pub-section-subtitle{font-size:12px;color:#777;line-height:1.6;margin:0}.pub-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 16px}.pub-field{display:grid;align-content:start;gap:7px;min-width:0}.pub-field.full{grid-column:1/-1}.pub-field label{font-size:12px;font-weight:400;color:#292929;line-height:1.5}.pub-required{color:#555}.pub-field input,.pub-field textarea,.pub-field select{box-sizing:border-box;display:block;width:100%;min-width:0;min-height:44px;padding:11px 12px;border:1px solid #d8d8d8;border-radius:7px;background:#fff!important;color:#171717!important;font-family:inherit;font-size:13px;font-weight:400;line-height:1.4;outline:none;box-shadow:none}.pub-field textarea{min-height:104px;resize:vertical}.pub-field input::placeholder,.pub-field textarea::placeholder{color:#999;opacity:1}.pub-field input:focus,.pub-field textarea:focus,.pub-field select:focus{border-color:#777;box-shadow:0 0 0 2px rgba(0,0,0,.045)}.pub-field input:disabled,.pub-field textarea:disabled,.pub-field select:disabled{background:#f7f7f7!important;color:#777!important;opacity:1;cursor:not-allowed}.pub-field small{font-size:11px;color:#777;line-height:1.6}.pub-upload{display:flex;align-items:center;gap:12px;padding:12px;border:1px dashed #d2d2d2;border-radius:7px;background:#fff;min-width:0}.pub-upload svg{color:#555;flex-shrink:0}.pub-upload input{box-sizing:border-box;min-width:0;width:100%;max-width:100%;font-size:12px;background:#fff!important;color:#171717!important}.pub-upload-name{font-size:11px;color:#666;overflow-wrap:anywhere}.pub-submit{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;min-height:47px;margin-top:25px;padding:12px 16px;border:1px solid #222;border-radius:7px;background:#222!important;color:#fff!important;font-family:inherit;font-size:13px;font-weight:500;line-height:1.4;cursor:pointer;white-space:normal}.pub-submit:disabled{background:#f2f2f2!important;border-color:#e5e5e5;color:#888!important;opacity:1;cursor:not-allowed}.pub-error{padding:12px 14px;border:1px solid #e5baba;border-radius:7px;background:#fff8f8;color:#922b2b;font-size:13px;line-height:1.6;margin-bottom:20px;overflow-wrap:anywhere}.pub-success{text-align:center;padding:42px 28px;background:#fff;color:#171717}.pub-success-icon{display:grid;place-items:center;width:58px;height:58px;border-radius:50%;background:#f3f3f3;color:#333;margin:0 auto 17px}.pub-success h2{margin:0 0 9px;font-size:23px;font-weight:500;color:#171717}.pub-success p{color:#666;line-height:1.7;overflow-wrap:anywhere}.pub-reference{display:inline-block;max-width:100%;padding:10px 14px;border:1px solid #e5e5e5;border-radius:7px;background:#fff;font-family:ui-monospace,monospace;overflow-wrap:anywhere;color:#171717}.pub-footer{text-align:center;color:#777;font-size:11px;line-height:1.6;margin-top:17px}.pub-loading,.pub-unavailable{padding:42px 20px;text-align:center;color:#666;line-height:1.7;background:#fff}.pub-back{display:inline-flex;align-items:center;gap:7px;color:#555;font-size:12px;text-decoration:none;margin-bottom:18px}.pub-role-details{margin-top:20px;padding:17px;border:1px solid #e5e5e5;border-radius:8px;background:#fff;color:#171717}.pub-role-details h3{font-size:14px;font-weight:500;margin:0 0 8px;color:#171717}.pub-role-details p{font-size:13px;line-height:1.7;margin:0 0 12px;color:#555}.pub-role-details ul{font-size:12px;line-height:1.8;padding-left:18px;margin:7px 0 0;color:#444}.pub-role-metadata{display:flex;flex-wrap:wrap;gap:10px 16px;margin-top:12px;font-size:12px;color:#555}.pub-role-metadata span{display:inline-flex;align-items:center;gap:6px;min-width:0;overflow-wrap:anywhere}.pub-role-metadata svg{flex-shrink:0}.pub-lock-note{display:flex;align-items:flex-start;gap:9px;padding:12px 13px;border:1px solid #e5e5e5;border-radius:7px;background:#fafafa;color:#666;font-size:12px;line-height:1.6;margin-bottom:22px}.pub-lock-note svg{flex-shrink:0;margin-top:1px}.pub-role-picker{position:relative;min-width:0;width:100%}.pub-role-trigger{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:46px;padding:11px 12px;border:1px solid #d8d8d8;border-radius:7px;background:#fff;color:#171717;text-align:left;cursor:pointer;font:inherit}.pub-role-trigger span{min-width:0;overflow-wrap:anywhere}.pub-role-menu{position:absolute;z-index:30;top:calc(100% + 6px);left:0;right:0;max-height:min(320px,38dvh);overflow-y:auto;overscroll-behavior:contain;background:#fff;border:1px solid #dedede;border-radius:9px;box-shadow:0 12px 30px rgba(0,0,0,.12);padding:8px}.pub-role-search{position:sticky;top:0;z-index:1;box-sizing:border-box;width:100%;height:40px;padding:8px 10px;border:1px solid #dedede;border-radius:7px;background:#fff;color:#171717;margin-bottom:6px}.pub-role-option{display:block;width:100%;padding:10px;border:0;border-radius:6px;background:#fff;color:#171717;text-align:left;font:inherit;font-size:13px;line-height:1.45;white-space:normal;overflow-wrap:anywhere;cursor:pointer}.pub-role-option:hover,.pub-role-option[aria-selected="true"]{background:#f3f3f3}.pub-role-option:focus-visible{outline:2px solid #777;outline-offset:-2px}.pub-repeat-card{grid-column:1/-1;border:1px solid #e8e8e8;border-radius:9px;padding:16px;background:#fdfdfd}.pub-repeat-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.pub-repeat-head strong{font-size:13px;font-weight:500;color:#333}.pub-remove{border:1px solid #e2e2e2;border-radius:6px;background:#fff;color:#555;font-size:11px;padding:7px 10px;cursor:pointer}.pub-add{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid #d8d8d8;border-radius:7px;background:#fff;color:#333;font:inherit;font-size:12px;cursor:pointer}.pub-add:disabled,.pub-remove:disabled{opacity:.5;cursor:not-allowed}
@media(max-width:640px){.pub-role-menu{max-height:min(280px,34dvh)}.pub-role-option{white-space:normal}.public-form-page{padding:20px 12px 30px}.pub-wrap{max-width:100%}.pub-brand{margin-bottom:15px}.pub-logo{width:35px;height:35px}.pub-card{border-radius:9px}.pub-hero{padding:22px 18px}.pub-hero h1{font-size:23px}.pub-hero p{font-size:13px}.pub-role-details{padding:13px;margin-top:16px}.pub-body{padding:22px 18px}.pub-fields{grid-template-columns:minmax(0,1fr);gap:15px}.pub-field.full,.pub-repeat-card{grid-column:auto}.pub-field input,.pub-field textarea,.pub-field select{font-size:16px;min-height:46px}.pub-upload{align-items:flex-start;padding:10px;gap:9px}.pub-upload input{font-size:12px;max-width:100%}.pub-submit{min-height:48px;margin-top:22px}.pub-success{padding:32px 18px}.pub-success h2{font-size:21px}.pub-role-metadata{display:grid;grid-template-columns:minmax(0,1fr);gap:9px}.pub-lock-note{font-size:12px}.pub-section{padding-bottom:22px;margin-bottom:22px}.pub-repeat-card{padding:13px}}
@media(max-width:360px){.public-form-page{padding:14px 8px 24px}.pub-hero{padding:19px 14px}.pub-body{padding:19px 14px}.pub-hero h1{font-size:21px}.pub-upload{display:block}.pub-upload svg{margin-bottom:8px}.pub-upload input{display:block}}
      `}</style>

      <div className="pub-wrap">
        <div className="pub-brand">
          <img className="pub-logo" src="/favicon.ico" alt="BR30" />
          <span>
            BR30 <span style={{ fontWeight: 450, color: "var(--pub-muted)" }}>Talent Pipeline</span>
          </span>
        </div>

        {loading ? (
          <div className="pub-card pub-loading">
            <LoaderCircle size={25} />
            <p>Loading application form...</p>
          </div>
        ) : error && !form && !isUniversal ? (
          <div className="pub-card pub-unavailable">
            <h2>Form unavailable</h2>
            <p>{error}</p>
            <Link to="/" className="pub-back">
              <ArrowLeft size={15} /> Return to website
            </Link>
          </div>
        ) : error && isUniversal && !roles.length ? (
          <div className="pub-card pub-unavailable">
            <h2>Unable to load job roles</h2>
            <p>{error}</p>
            <button type="button" className="pub-submit" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        ) : isUniversal && !roles.length ? (
          <div className="pub-card pub-unavailable">
            <h2>No active job roles available</h2>
            <p>Please check back later for available opportunities.</p>
          </div>
        ) : result ? (
          <div className="pub-card pub-success">
            <div className="pub-success-icon">
              <CheckCircle2 size={32} />
            </div>
            <h2>Application submitted!</h2>
            <p>
              Thank you for applying for <strong>{currentRole?.title || form?.jobRole || "this role"}</strong>. Your application has been received successfully.
            </p>
            <div className="pub-reference">Reference: {String(result?.applicationId || result?.data?.applicationId || result?.application?._id || "SUBMITTED")}</div>
            <p>Keep this reference for your records.</p>
            {isUniversal && (
              <button type="button" className="pub-submit" onClick={resetApplication}>
                Apply for another role
              </button>
            )}
          </div>
        ) : (
          <div className="pub-card">
            <div className="pub-hero">
              <h1>{isUniversal ? "Start Your Career Journey" : form?.title || "Job Application"}</h1>
              <p>{isUniversal ? "Choose a job role to view its details and unlock the application form." : form?.description || "Complete the details below to submit your application."}</p>
              {isUniversal ? (
                <div className="pub-role-details">
                  <div className="pub-field">
                    <label htmlFor="jobRoleSelect">
                      Select job role <span className="pub-required">*</span>
                    </label>
                    <div className="pub-role-picker">
                      <button type="button" id="jobRoleSelect" className="pub-role-trigger" aria-haspopup="listbox" aria-expanded={roleDropdownOpen} onClick={() => setRoleDropdownOpen((open) => !open)}>
                        <span>{selectedRole ? `${selectedRole.title}${selectedRole.departmentId?.name || selectedRole.department?.name ? ` — ${selectedRole.departmentId?.name || selectedRole.department?.name}` : ""}` : "Choose a job role"}</span>
                        <ChevronDown size={16} aria-hidden="true" />
                      </button>
                      {roleDropdownOpen && (
                        <div className="pub-role-menu" role="listbox" aria-label="Available job roles">
                          <input className="pub-role-search" value={roleSearch} onChange={(event) => setRoleSearch(event.target.value)} placeholder="Search job roles..." aria-label="Search job roles" autoFocus />
                          {filteredRoles.length ? (
                            filteredRoles.map((role) => (
                              <button
                                type="button"
                                role="option"
                                aria-selected={getId(role) === selectedRoleId}
                                className="pub-role-option"
                                key={getId(role)}
                                onClick={() => {
                                  selectRole({ target: { value: getId(role) } });
                                  setRoleDropdownOpen(false);
                                  setRoleSearch("");
                                }}>
                                {role.title}
                                {role.departmentId?.name ? ` — ${role.departmentId.name}` : role.department?.name ? ` — ${role.department.name}` : ""}
                              </button>
                            ))
                          ) : (
                            <div className="pub-role-option">No matching roles found.</div>
                          )}
                        </div>
                      )}
                    </div>
                    <small>{roles.length} active job roles available. Select a role to unlock the application fields.</small>
                  </div>
                  {selectedRole && (
                    <>
                      <h3 style={{ marginTop: 18 }}>{selectedRole.title}</h3>
                      {selectedRole.description && <p>{selectedRole.description}</p>}
                      <div className="pub-role-metadata">
                        {(selectedRole.departmentId?.name || selectedRole.department?.name) && (
                          <span>
                            <BriefcaseBusiness size={14} />
                            {selectedRole.departmentId?.name || selectedRole.department?.name}
                          </span>
                        )}
                        {selectedRole.location && (
                          <span>
                            <MapPin size={14} />
                            {selectedRole.location}
                          </span>
                        )}
                        {selectedRole.employmentType && (
                          <span>
                            <BriefcaseBusiness size={14} />
                            {formatValue(selectedRole.employmentType)}
                          </span>
                        )}
                        {selectedRole.workMode && (
                          <span>
                            <MapPin size={14} />
                            {formatValue(selectedRole.workMode)}
                          </span>
                        )}
                        <span>
                          <Clock3 size={14} />
                          Minimum experience: {selectedRole.minExperienceYears ?? 0} years
                        </span>
                        <span>
                          <IndianRupee size={14} />
                          {formatSalary(selectedRole.salaryMin, selectedRole.salaryMax, selectedRole.currency)}
                        </span>
                      </div>
                      {Array.isArray(selectedRole.responsibilities) && selectedRole.responsibilities.length > 0 && (
                        <div style={{ marginTop: 15 }}>
                          <h3>Key responsibilities</h3>
                          <ul>
                            {selectedRole.responsibilities.map((item, index) => (
                              <li key={`${index}-${item}`}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {Array.isArray(selectedRole.requiredSkills) && selectedRole.requiredSkills.length > 0 && (
                        <div style={{ marginTop: 15 }}>
                          <h3>Required skills</h3>
                          <div className="pub-job">
                            {selectedRole.requiredSkills.map((skill) => (
                              <span key={skill}>{skill}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {Array.isArray(selectedRole.preferredSkills) && selectedRole.preferredSkills.length > 0 && (
                        <div style={{ marginTop: 15 }}>
                          <h3>Preferred skills</h3>
                          <div className="pub-job">
                            {selectedRole.preferredSkills.map((skill) => (
                              <span key={skill}>{skill}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="pub-job">
                  <span>{form?.jobRole || "Open position"}</span>
                  {form?.department && <span>{form.department}</span>}
                </div>
              )}
            </div>

            <form className="pub-body" onSubmit={submit}>
              {error && (
                <div className="pub-error" role="alert">
                  {error}
                </div>
              )}
              {!roleSelected && (
                <div className="pub-lock-note">
                  <LockKeyhole size={17} />
                  Select a job role above to unlock the application fields and Submit button.
                </div>
              )}

              <section className="pub-section">
                <SectionHeading icon={UserRound} title="Personal information" subtitle="Share your contact details so the hiring team can reach you." />
                <div className="pub-fields">
                  <div className="pub-field">
                    <label htmlFor="fullName">Full name *</label>
                    <input id="fullName" name="fullName" required disabled={disabled} minLength={2} maxLength={120} value={values.fullName} onChange={change} autoComplete="name" placeholder="Your full name" />
                  </div>
                  <div className="pub-field">
                    <label htmlFor="email">Email address *</label>
                    <input id="email" name="email" type="email" required disabled={disabled} maxLength={254} value={values.email} onChange={change} autoComplete="email" placeholder="you@example.com" />
                  </div>
                  <div className="pub-field">
                    <label htmlFor="mobile">Mobile number *</label>
                    <input id="mobile" name="mobile" type="tel" required disabled={disabled} minLength={7} maxLength={25} value={values.mobile} onChange={change} autoComplete="tel" placeholder="Phone number with country code" />
                  </div>
                  <div className="pub-field">
                    <label htmlFor="location">Current location</label>
                    <input id="location" name="location" disabled={disabled} maxLength={200} value={values.location} onChange={change} placeholder="City, state, country" />
                  </div>
                </div>
              </section>

              <section className="pub-section">
                <SectionHeading icon={BriefcaseBusiness} title="Employment & experience" subtitle="Tell us about your current role and professional experience." />
                <div className="pub-fields">
                  <div className="pub-field">
                    <label htmlFor="currentJobTitle">Current job title</label>
                    <input id="currentJobTitle" name="currentJobTitle" disabled={disabled} maxLength={150} value={values.currentJobTitle} onChange={change} placeholder="e.g. Software Engineer" />
                  </div>
                  <div className="pub-field">
                    <label htmlFor="currentCompany">Current / most recent company</label>
                    <input id="currentCompany" name="currentCompany" disabled={disabled} maxLength={200} value={values.currentCompany} onChange={change} placeholder="Company name, if any" />
                  </div>
                  <div className="pub-field">
                    <label htmlFor="employmentStatus">Employment status</label>
                    <select id="employmentStatus" name="employmentStatus" disabled={disabled} value={values.employmentStatus} onChange={change}>
                      <option value="">Select status</option>
                      <option value="employed">Employed</option>
                      <option value="self_employed">Self-employed</option>
                      <option value="unemployed">Unemployed</option>
                      <option value="student">Student</option>
                      <option value="serving_notice">Serving notice period</option>
                    </select>
                  </div>
                  <div className="pub-field">
                    <label htmlFor="experienceYears">Total experience (years)</label>
                    <input id="experienceYears" name="experienceYears" type="number" min="0" max="60" step="0.5" disabled={disabled} value={values.experienceYears} onChange={change} />
                    {currentRole && <small>This role lists a minimum experience of {currentRole.minExperienceYears ?? 0} years.</small>}
                  </div>
                  <div className="pub-field">
                    <label htmlFor="noticePeriodDays">Notice period (days)</label>
                    <input id="noticePeriodDays" name="noticePeriodDays" type="number" min="0" max="365" disabled={disabled} value={values.noticePeriodDays} onChange={change} placeholder="e.g. 30" />
                  </div>
                  <div className="pub-field full">
                    <label htmlFor="skills">{skillLabel}</label>
                    <input id="skills" name="skills" disabled={disabled} value={values.skills} onChange={change} placeholder={skillPlaceholder} />
                    <small>Separate skills with commas.</small>
                  </div>
                </div>
              </section>

              <section className="pub-section">
                <SectionHeading icon={Wallet} title="Compensation details" subtitle="Optional information to help align expectations early in the process." />
                <div className="pub-fields">
                  <div className="pub-field">
                    <label htmlFor="currentCtc">Current annual CTC (INR)</label>
                    <input id="currentCtc" name="currentCtc" type="number" min="0" max="1000000000000" disabled={disabled} value={values.currentCtc} onChange={change} placeholder="e.g. 450000" />
                  </div>
                  <div className="pub-field">
                    <label htmlFor="expectedCtc">Expected annual CTC (INR)</label>
                    <input id="expectedCtc" name="expectedCtc" type="number" min="0" max="1000000000000" disabled={disabled} value={values.expectedCtc} onChange={change} placeholder="e.g. 600000" />
                  </div>
                  <div className="pub-field">
                    <label htmlFor="expectedSalary">Expected salary (INR, optional)</label>
                    <input id="expectedSalary" name="expectedSalary" type="number" min="0" max="1000000000000" disabled={disabled} value={values.expectedSalary} onChange={change} placeholder="If different from expected CTC" />
                  </div>
                </div>
              </section>

              <section className="pub-section">
                <SectionHeading icon={GraduationCap} title="Education & qualifications" subtitle="Add your education history. You can include more than one qualification." />
                <div className="pub-fields">
                  {values.education.map((education, index) => (
                    <div className="pub-repeat-card" key={`education-${index}`}>
                      <div className="pub-repeat-head">
                        <strong>Education {index + 1}</strong>
                        {values.education.length > 1 && (
                          <button type="button" className="pub-remove" disabled={disabled} onClick={() => removeNested("education", index)}>
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="pub-fields">
                        <div className="pub-field">
                          <label>Qualification</label>
                          <input disabled={disabled} value={education.qualification} onChange={(event) => changeNested("education", index, "qualification", event.target.value)} placeholder="e.g. B.Tech, MBA, Class XII" maxLength={150} />
                        </div>
                        <div className="pub-field">
                          <label>Institution / university</label>
                          <input disabled={disabled} value={education.institution} onChange={(event) => changeNested("education", index, "institution", event.target.value)} placeholder="School, college or university" maxLength={200} />
                        </div>
                        <div className="pub-field">
                          <label>Field of study</label>
                          <input disabled={disabled} value={education.fieldOfStudy} onChange={(event) => changeNested("education", index, "fieldOfStudy", event.target.value)} placeholder="e.g. Computer Science" maxLength={150} />
                        </div>
                        <div className="pub-field">
                          <label>Graduation year</label>
                          <input type="number" min="1950" max={new Date().getFullYear() + 10} disabled={disabled} value={education.graduationYear} onChange={(event) => changeNested("education", index, "graduationYear", event.target.value)} placeholder="e.g. 2025" />
                        </div>
                        <div className="pub-field full">
                          <label>Grade / percentage / CGPA</label>
                          <input disabled={disabled} value={education.grade} onChange={(event) => changeNested("education", index, "grade", event.target.value)} placeholder="e.g. 8.2 CGPA or 82%" maxLength={50} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pub-field full">
                    <button type="button" className="pub-add" disabled={disabled || values.education.length >= 5} onClick={() => addNested("education", emptyEducation, 5)}>
                      + Add another qualification
                    </button>
                  </div>
                </div>
              </section>

              <section className="pub-section">
                <SectionHeading icon={FolderKanban} title="Projects & portfolio work" subtitle="Highlight projects that demonstrate your skills. All project fields are optional." />
                <div className="pub-fields">
                  {values.projects.map((project, index) => (
                    <div className="pub-repeat-card" key={`project-${index}`}>
                      <div className="pub-repeat-head">
                        <strong>Project {index + 1}</strong>
                        {values.projects.length > 1 && (
                          <button type="button" className="pub-remove" disabled={disabled} onClick={() => removeNested("projects", index)}>
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="pub-fields">
                        <div className="pub-field full">
                          <label>Project name</label>
                          <input disabled={disabled} value={project.name} onChange={(event) => changeNested("projects", index, "name", event.target.value)} placeholder="Name of your project" maxLength={180} />
                        </div>
                        <div className="pub-field full">
                          <label>Project description</label>
                          <textarea disabled={disabled} value={project.description} onChange={(event) => changeNested("projects", index, "description", event.target.value)} placeholder="What did you build, and what was your contribution?" maxLength={3000} />
                        </div>
                        <div className="pub-field">
                          <label>Project URL</label>
                          <input type="url" disabled={disabled} value={project.url} onChange={(event) => changeNested("projects", index, "url", event.target.value)} placeholder="https://..." />
                        </div>
                        <div className="pub-field">
                          <label>Technologies / tools</label>
                          <input disabled={disabled} value={project.technologies} onChange={(event) => changeNested("projects", index, "technologies", event.target.value)} placeholder="React, Node.js, MongoDB" />
                          <small>Separate technologies with commas.</small>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pub-field full">
                    <button type="button" className="pub-add" disabled={disabled || values.projects.length >= 5} onClick={() => addNested("projects", emptyProject, 5)}>
                      + Add another project
                    </button>
                  </div>
                </div>
              </section>

              <section className="pub-section">
                <SectionHeading icon={Link2} title="Professional profiles" subtitle="Add links that help the hiring team learn more about your work." />
                <div className="pub-fields">
                  <div className="pub-field">
                    <label htmlFor="linkedinUrl">LinkedIn profile</label>
                    <input id="linkedinUrl" name="linkedinUrl" type="url" disabled={disabled} value={values.linkedinUrl} onChange={change} placeholder="https://linkedin.com/in/..." />
                  </div>
                  {(roleCategory === "technology" || roleCategory === "management" || values.githubUrl) && (
                    <div className="pub-field">
                      <label htmlFor="githubUrl">GitHub profile</label>
                      <input id="githubUrl" name="githubUrl" type="url" disabled={disabled} value={values.githubUrl} onChange={change} placeholder="https://github.com/..." />
                    </div>
                  )}
                  <div className="pub-field full">
                    <label htmlFor="portfolioUrl">{roleCategory === "creative" ? "Portfolio URL" : "Portfolio / work sample URL"}</label>
                    <input id="portfolioUrl" name="portfolioUrl" type="url" disabled={disabled} value={values.portfolioUrl} onChange={change} placeholder="https://..." />
                  </div>
                </div>
              </section>

              {allowCoverLetter && (
                <section className="pub-section">
                  <SectionHeading icon={FileText} title="Cover letter" subtitle="Briefly explain why you are a good fit for this role." />
                  <div className="pub-fields">
                    <div className="pub-field full">
                      <label htmlFor="coverLetter">Message to the hiring team</label>
                      <textarea id="coverLetter" name="coverLetter" disabled={disabled} maxLength={5000} value={values.coverLetter} onChange={change} placeholder={`Tell us why you're a good fit for ${currentRole?.title || "this role"}.`} />
                      <small>{values.coverLetter.length}/5000 characters</small>
                    </div>
                  </div>
                </section>
              )}

              <section className="pub-section">
                <SectionHeading icon={FileText} title="Documents" subtitle="Attach your resume and, if you wish, a profile photo." />
                <div className="pub-fields">
                  <div className="pub-field full">
                    <label htmlFor="resume">Resume (PDF, max 5 MB) *</label>
                    <div className="pub-upload">
                      <FileText size={22} />
                      <input id="resume" type="file" accept="application/pdf,.pdf" required disabled={disabled} onChange={(event) => setResume(event.target.files?.[0] || null)} />
                    </div>
                    {resume && (
                      <small className="pub-upload-name">
                        Selected: {resume.name} ({(resume.size / 1024 / 1024).toFixed(2)} MB)
                      </small>
                    )}
                  </div>
                  {allowProfileImage && (
                    <div className="pub-field full">
                      <label htmlFor="profileImage">Profile photo (optional, JPG/PNG/WebP, max 2 MB)</label>
                      <div className="pub-upload">
                        <UploadCloud size={22} />
                        <input id="profileImage" type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={(event) => setProfileImage(event.target.files?.[0] || null)} />
                      </div>
                      {profileImage && (
                        <small className="pub-upload-name">
                          Selected: {profileImage.name} ({(profileImage.size / 1024 / 1024).toFixed(2)} MB)
                        </small>
                      )}
                    </div>
                  )}
                </div>
              </section>

              <button className="pub-submit" type="submit" disabled={disabled}>
                {submitting ? (
                  <>
                    <LoaderCircle size={18} />
                    Submitting application...
                  </>
                ) : (
                  "Submit application"
                )}
              </button>
              <div className="pub-footer">Your information will be used to process this job application.</div>
            </form>
          </div>
        )}
        <div className="pub-footer">Powered by BR30 Group</div>
      </div>
    </div>
  );
}
