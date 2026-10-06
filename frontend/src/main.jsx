import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  Activity,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  UserRound,
  X,
  History,
  CheckCircle2,
  LockKeyhole,
  Mail,
  AlertCircle
} from "lucide-react";

import "./styles.css";

/* =========================================================
   API
========================================================= */

const API = "http://localhost:5000/api";

/* =========================================================
   SAFE HELPERS
========================================================= */

const asArray = value => {
  return Array.isArray(value) ? value : [];
};

const getArray = (response, key) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.[key])) {
    return response[key];
  }

  if (Array.isArray(response?.data?.[key])) {
    return response.data[key];
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

/* =========================================================
   NORMALIZE MEDICINE DATA
   Handles both:
   name / medicine_name
   time / reminder_time
========================================================= */

const normalizeMedicine = medicine => {
  if (!medicine || typeof medicine !== "object") {
    return null;
  }

  return {
    ...medicine,
    id: medicine.id,
    name: medicine.name ?? medicine.medicine_name ?? "",
    dose: medicine.dose ?? "",
    frequency: medicine.frequency ?? "",
    time: medicine.time ?? medicine.reminder_time ?? "",
    duration: medicine.duration ?? "",
    status: medicine.status ?? "Active"
  };
};

/* =========================================================
   NORMALIZE REMINDER DATA
========================================================= */

const normalizeReminder = reminder => {
  if (!reminder || typeof reminder !== "object") {
    return null;
  }

  let fallbackDate = "";

  if (reminder.created_at) {
    const created = new Date(reminder.created_at);

    if (!Number.isNaN(created.getTime())) {
      fallbackDate = created.toISOString().slice(0, 10);
    }
  }

  return {
    ...reminder,

    id: reminder.id,

    medicine_name:
      reminder.medicine_name ??
      reminder.name ??
      reminder.medicine ??
      "",

    dose: reminder.dose ?? "",

    frequency: reminder.frequency ?? "",

    reminder_date:
      reminder.reminder_date ??
      reminder.date ??
      fallbackDate,

    reminder_time:
      reminder.reminder_time ??
      reminder.time ??
      "",

    notes: reminder.notes ?? "",

    status: reminder.status ?? "pending"
  };
};

/* =========================================================
   API REQUEST
========================================================= */

async function api(path, options = {}) {
  const token = localStorage.getItem("medivault_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      "Something went wrong"
    );
  }

  return data;
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token =
      localStorage.getItem("medivault_token");

    if (!token) {
      setLoading(false);
      return;
    }

    api("/auth/me")
      .then(data => {
        setUser(data.user ?? data);
      })
      .catch(() => {
        localStorage.removeItem(
          "medivault_token"
        );
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loadingScreen">
        <HeartPulse size={30} />
        <span>Loading MediVault...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLogin={setUser} />;
  }

  return (
    <Workspace
      user={user}
      onLogout={() => {
        localStorage.removeItem(
          "medivault_token"
        );

        setUser(null);
      }}
    />
  );
}

/* =========================================================
   AUTH PAGE
========================================================= */

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();

    setError("");
    setBusy(true);

    try {
      const endpoint =
        mode === "login"
          ? "/auth/login"
          : "/auth/register";

      const data = await api(endpoint, {
        method: "POST",
        body: JSON.stringify(form)
      });

      if (!data.token) {
        throw new Error(
          "Login succeeded but no authentication token was returned."
        );
      }

      localStorage.setItem(
        "medivault_token",
        data.token
      );

      onLogin(data.user);
    } catch (error) {
      setError(
        error.message ||
        "Something went wrong"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="authShell">
      <div className="authCard">

        <section className="authBrand">

          <div className="brandMark">
            <HeartPulse size={25} />
          </div>

          <h1>MediVault</h1>

          <p>
            Digital prescription and medication
            tracking in one organized health
            workspace.
          </p>

          <div className="authPoints">

            <div className="authPoint">
              <Check size={15} />
              Save prescriptions securely
            </div>

            <div className="authPoint">
              <Check size={15} />
              Save medicines and schedules
            </div>

            <div className="authPoint">
              <Check size={15} />
              Create reminders before taking doses
            </div>

            <div className="authPoint">
              <Check size={15} />
              Review your medication history
            </div>

          </div>
        </section>

        <section className="authForm">

          <p className="eyebrow">
            <ShieldCheck size={14} />
            SECURE HEALTH WORKSPACE
          </p>

          <h2>
            {mode === "login"
              ? "Welcome back"
              : "Create your account"}
          </h2>

          <p>
            {mode === "login"
              ? "Log in to access your saved medicines, prescriptions and reminders."
              : "Create an account so your health records can be stored in the database."}
          </p>

          <div className="authTabs">

            <button
              type="button"
              className={
                mode === "login"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Login
            </button>

            <button
              type="button"
              className={
                mode === "register"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setMode("register");
                setError("");
              }}
            >
              Register
            </button>

          </div>

          {error && (
            <div className="authError">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <form onSubmit={submit}>

            {mode === "register" && (
              <>
                <Field
                  label="Full name"
                  name="name"
                  value={form.name}
                  onChange={event =>
                    setForm({
                      ...form,
                      name: event.target.value
                    })
                  }
                  placeholder="Enter your name"
                  icon={
                    <UserRound size={15} />
                  }
                  required
                />

                <Field
                  label="Mobile number"
                  name="phone"
                  value={form.phone}
                  onChange={event =>
                    setForm({
                      ...form,
                      phone: event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                    })
                  }
                  placeholder="10-digit mobile number"
                  type="tel"
                  icon={<span>+91</span>}
                  required
                />
              </>
            )}

            <Field
              label="Email"
              name="email"
              value={form.email}
              onChange={event =>
                setForm({
                  ...form,
                  email: event.target.value
                })
              }
              placeholder="you@example.com"
              type="email"
              icon={<Mail size={15} />}
              required
            />

            <Field
              label="Password"
              name="password"
              value={form.password}
              onChange={event =>
                setForm({
                  ...form,
                  password: event.target.value
                })
              }
              placeholder="At least 6 characters"
              type="password"
              icon={
                <LockKeyhole size={15} />
              }
              required
            />

            <button
              className="primary authSubmit"
              disabled={busy}
            >
              {busy
                ? "Please wait..."
                : mode === "login"
                ? "Login to MediVault"
                : "Create account"}
            </button>

          </form>

          <div className="authHint">
            Your login is protected by password
            hashing and token-based authentication.
          </div>

        </section>

      </div>
    </div>
  );
}

/* =========================================================
   WORKSPACE
========================================================= */

function Workspace({ user, onLogout }) {
  const [currentUser, setCurrentUser] =
    useState(user);

  const [page, setPage] =
    useState("Dashboard");

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [query, setQuery] =
    useState("");

  const [meds, setMeds] =
    useState([]);

  const [prescriptions, setPrescriptions] =
    useState([]);

  const [reminders, setReminders] =
    useState([]);

  const [history, setHistory] =
    useState([]);

  const [showMed, setShowMed] =
    useState(false);

  const [showRx, setShowRx] =
    useState(false);

  const [showReminder, setShowReminder] =
    useState(false);

  const [toast, setToast] =
    useState("");

  const [dataLoading, setDataLoading] =
    useState(true);

  const [dueReminder, setDueReminder] =
    useState(null);

  const [snoozedReminders, setSnoozedReminders] =
    useState({});

  /* =======================================================
     TOAST
  ======================================================= */

  const notify = message => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 2600);
  };

  /* =======================================================
     LOAD ALL DATA
  ======================================================= */

async function loadData() {
  setDataLoading(true);

  try {
    // Load each section separately so one failed request
    // does not stop medicines/prescriptions from loading.

    try {
      const response = await api("/medicines");

      const medicines = getArray(
        response,
        "medicines"
      )
        .map(normalizeMedicine)
        .filter(Boolean);

      setMeds(medicines);
    } catch (error) {
      console.error(
        "Medicines loading error:",
        error
      );
      setMeds([]);
    }

    try {
      const response = await api("/prescriptions");

      const prescriptions = getArray(
        response,
        "prescriptions"
      );

      setPrescriptions(
        asArray(prescriptions)
      );
    } catch (error) {
      console.error(
        "Prescriptions loading error:",
        error
      );
      setPrescriptions([]);
    }

    try {
      const response = await api("/reminders");

      const reminders = getArray(
        response,
        "reminders"
      )
        .map(normalizeReminder)
        .filter(Boolean);

      setReminders(reminders);
    } catch (error) {
      console.error(
        "Reminders loading error:",
        error
      );
      setReminders([]);
    }

    try {
      const response = await api("/history");

      const historyData = getArray(
        response,
        "history"
      );

      setHistory(
        asArray(historyData)
      );
    } catch (error) {
      console.error(
        "History loading error:",
        error
      );
      setHistory([]);
    }

  } catch (error) {
    console.error(
      "Data loading error:",
      error
    );

    notify(
      error.message ||
      "Unable to load your records."
    );

  } finally {
    setDataLoading(false);
  }
}
  /* =======================================================
     INITIAL DATA LOAD
  ======================================================= */

  useEffect(() => {
    loadData();
  }, []);

  /* =======================================================
     REFRESH REMINDERS EVERY 15 SECONDS
  ======================================================= */

  useEffect(() => {
    const timer = setInterval(
      async () => {
        try {
          const response =
            await api("/reminders");

          const refreshed =
            getArray(
              response,
              "reminders"
            )
              .map(normalizeReminder)
              .filter(Boolean);

          setReminders(refreshed);
        } catch (error) {
          console.error(
            "Reminder refresh error:",
            error
          );
        }
      },
      15000
    );

    return () => {
      clearInterval(timer);
    };
  }, []);

  /* =======================================================
     FAKE / IN-APP REMINDER CHECKER
     
     Checks every 2 seconds.
     
     No:
     - SMS
     - Twilio
     - Chrome notification
     - external API
     
     Only the MediVault popup.
  ======================================================= */

  useEffect(() => {
    function checkDueReminders() {
      const now = Date.now();

      const found =
        reminders.find(reminder => {

          if (!reminder) {
            return false;
          }

          if (
            String(reminder.status)
              .toLowerCase() ===
            "completed"
          ) {
            return false;
          }

          if (
            String(reminder.status)
              .toLowerCase() ===
            "taken"
          ) {
            return false;
          }

          if (
            !reminder.id ||
            !reminder.reminder_date ||
            !reminder.reminder_time
          ) {
            return false;
          }

          const dueAt =
            new Date(
              `${reminder.reminder_date}T${reminder.reminder_time}`
            ).getTime();

          if (!Number.isFinite(dueAt)) {
            return false;
          }

          if (dueAt > now) {
            return false;
          }

          const snoozeUntil =
            snoozedReminders[
              reminder.id
            ];

          if (
            snoozeUntil &&
            now < snoozeUntil
          ) {
            return false;
          }

          return true;
        });

      if (found) {
        setDueReminder(found);
      }
    }

    checkDueReminders();

    const timer = setInterval(
      checkDueReminders,
      2000
    );

    return () => {
      clearInterval(timer);
    };
  }, [
    reminders,
    snoozedReminders
  ]);

  /* =======================================================
     SAVE MEDICINE
  ======================================================= */

  async function saveMedicine(form) {
    try {
      await api("/medicines", {
        method: "POST",
        body: JSON.stringify(form)
      });

      setShowMed(false);

      await loadData();

      notify(
        "Medicine saved to database"
      );
    } catch (error) {
      notify(error.message);
    }
  }

  /* =======================================================
     SAVE PRESCRIPTION
  ======================================================= */

  async function savePrescription(form) {
    try {
      await api("/prescriptions", {
        method: "POST",
        body: JSON.stringify(form)
      });

      setShowRx(false);

      await loadData();

      notify(
        "Prescription saved to database"
      );
    } catch (error) {
      notify(error.message);
    }
  }

  /* =======================================================
     SAVE REMINDER
  ======================================================= */

  async function saveReminder(form) {
    try {
      await api("/reminders", {
        method: "POST",
        body: JSON.stringify({
          medicine_name:
            form.medicine_name,
          dose: form.dose,
          frequency:
            form.frequency,
          reminder_date:
            form.reminder_date,
          reminder_time:
            form.reminder_time,
          notes: form.notes
        })
      });

      setShowReminder(false);

      await loadData();

      notify(
        "Reminder saved to database"
      );
    } catch (error) {
      notify(error.message);
    }
  }

  /* =======================================================
     DELETE MEDICINE
  ======================================================= */

  async function deleteMedicine(id) {
    try {
      await api(
        `/medicines/${id}`,
        {
          method: "DELETE"
        }
      );

      await loadData();

      notify("Medicine deleted");
    } catch (error) {
      notify(error.message);
    }
  }

  /* =======================================================
     MARK REMINDER AS TAKEN
  ======================================================= */

  async function markReminder(id) {
    try {
      await api(
        `/reminders/${id}/complete`,
        {
          method: "PATCH"
        }
      );

      setSnoozedReminders(
        previous => {
          const copy = {
            ...previous
          };

          delete copy[id];

          return copy;
        }
      );

      setDueReminder(null);

      await loadData();

      notify(
        "Reminder marked as taken"
      );
    } catch (error) {
      notify(error.message);
    }
  }

  /* =======================================================
     REMIND ME LATER
     
     Snoozes the fake popup for 5 minutes.
  ======================================================= */

  function remindMeLater(reminder) {
    if (!reminder?.id) {
      setDueReminder(null);
      return;
    }

    setSnoozedReminders(
      previous => ({
        ...previous,
        [reminder.id]:
          Date.now() +
          5 * 60 * 1000
      })
    );

    setDueReminder(null);

    notify(
      "Reminder snoozed for 5 minutes"
    );
  }

  /* =======================================================
     DELETE REMINDER
  ======================================================= */

  async function deleteReminder(id) {
    try {
      await api(
        `/reminders/${id}`,
        {
          method: "DELETE"
        }
      );

      setDueReminder(null);

      setSnoozedReminders(
        previous => {
          const copy = {
            ...previous
          };

          delete copy[id];

          return copy;
        }
      );

      await loadData();

      notify("Reminder deleted");
    } catch (error) {
      notify(error.message);
    }
  }

  /* =======================================================
     PROFILE
  ======================================================= */

  async function saveProfile(form) {
    try {
      const data =
        await api("/profile", {
          method: "PUT",
          body: JSON.stringify(form)
        });

      notify(
        "Profile updated successfully"
      );

      return data.user;
    } catch (error) {
      notify(error.message);
      return null;
    }
  }

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const nav = [
    [
      "Dashboard",
      LayoutDashboard
    ],
    [
      "Prescriptions",
      FileText
    ],
    [
      "Medicines",
      Pill
    ],
    [
      "Reminders",
      Bell
    ],
    [
      "History",
      History
    ]
  ];

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredMeds =
    useMemo(() => {
      return asArray(meds).filter(
        medicine =>
          `${medicine.name ?? ""} ${
            medicine.dose ?? ""
          } ${
            medicine.frequency ?? ""
          }`
            .toLowerCase()
            .includes(
              query.toLowerCase()
            )
      );
    }, [meds, query]);

  const filteredRx =
    useMemo(() => {
      return asArray(
        prescriptions
      ).filter(
        prescription =>
          `${prescription.doctor ?? ""} ${
            prescription.diagnosis ?? ""
          }`
            .toLowerCase()
            .includes(
              query.toLowerCase()
            )
      );
    }, [prescriptions, query]);

  /* =======================================================
     WORKSPACE UI
  ======================================================= */

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside
        className={`sidebar ${
          menuOpen ? "open" : ""
        }`}
      >

        <div className="brand">

          <div className="brandMark">
            <HeartPulse size={22} />
          </div>

          <div>
            <strong>
              MediVault
            </strong>

            <span>
              Health, organized.
            </span>
          </div>

        </div>

        <div className="navLabel">
          MAIN MENU
        </div>

        <nav>

          {nav.map(
            ([label, Icon]) => (
              <button
                key={label}
                className={
                  page === label
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setPage(label);
                  setMenuOpen(false);
                }}
              >

                <Icon size={19} />

                <span>
                  {label}
                </span>

                {label ===
                  "Reminders" && (
                  <b className="navDot">
                    {
                      reminders.filter(
                        reminder =>
                          String(
                            reminder.status
                          ).toLowerCase() !==
                          "completed"
                      ).length
                    }
                  </b>
                )}

              </button>
            )
          )}

        </nav>

        <div className="navLabel extra">
          ACCOUNT
        </div>

        <nav>

          <button
            className={
              page === "Profile"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("Profile")
            }
          >
            <UserRound size={19} />
            <span>
              My Profile
            </span>
          </button>

          <button
            className={
              page === "Settings"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("Settings")
            }
          >
            <Settings size={19} />
            <span>
              Settings
            </span>
          </button>

        </nav>

        <div className="sidebarBottom">

          <div className="securityCard">

            <ShieldCheck size={19} />

            <div>
              <b>
                Your data is private
              </b>

              <span>
                Stored for your account.
              </span>
            </div>

          </div>

          <button
            className="logout"
            onClick={onLogout}
          >
            <LogOut size={18} />
            Log out
          </button>

        </div>

      </aside>

      {/* MAIN */}

      <main className="main">

        {/* TOP BAR */}

        <header className="topbar">

          <button
            className="mobileMenu"
            onClick={() =>
              setMenuOpen(
                !menuOpen
              )
            }
          >
            <Menu />
          </button>

          <div className="crumb">

            <span>
              Workspace
            </span>

            <ChevronRight
              size={15}
            />

            <b>
              {page}
            </b>

          </div>

          <div className="topActions">

            <div className="globalSearch">

              <Search size={17} />

              <input
                value={query}
                onChange={event =>
                  setQuery(
                    event.target.value
                  )
                }
                placeholder="Search medicines, prescriptions..."
              />

              {query && (
                <button
                  type="button"
                  onClick={() =>
                    setQuery("")
                  }
                >
                  <X size={14} />
                </button>
              )}

            </div>

            <button
              className="iconBtn"
              onClick={() =>
                setPage("Reminders")
              }
            >
              <Bell size={19} />

              <i>
                {
                  reminders.filter(
                    reminder =>
                      String(
                        reminder.status
                      ).toLowerCase() !==
                      "completed"
                  ).length
                }
              </i>
            </button>

            <div className="avatar">

              {(currentUser.name ||
                "User")
                .split(" ")
                .map(
                  part =>
                    part[0]
                )
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase()}

            </div>

          </div>

        </header>

        {/* CONTENT */}

        <div className="content">

          {dataLoading ? (

            <div className="loadingScreen inline">

              <HeartPulse size={26} />

              <span>
                Loading your records...
              </span>

            </div>

          ) : (

            <>

              {page ===
                "Dashboard" && (
                <Dashboard
                  user={currentUser}
                  meds={meds}
                  prescriptions={
                    prescriptions
                  }
                  reminders={
                    reminders
                  }
                  onAdd={() =>
                    setShowMed(true)
                  }
                  onRx={() =>
                    setShowRx(true)
                  }
                  onReminder={() =>
                    setShowReminder(
                      true
                    )
                  }
                  onPage={setPage}
                />
              )}

              {page ===
                "Medicines" && (
                <Medicines
                  meds={filteredMeds}
                  onAdd={() =>
                    setShowMed(true)
                  }
                  onDelete={
                    deleteMedicine
                  }
                />
              )}

              {page ===
                "Prescriptions" && (
                <Prescriptions
                  data={filteredRx}
                  onAdd={() =>
                    setShowRx(true)
                  }
                />
              )}

              {page ===
                "Reminders" && (
                <Reminders
                  reminders={
                    reminders
                  }
                  onAdd={() =>
                    setShowReminder(
                      true
                    )
                  }
                  onComplete={
                    markReminder
                  }
                  onDelete={
                    deleteReminder
                  }
                />
              )}

              {page ===
                "History" && (
                <HistoryPage
                  history={history}
                />
              )}

              {page ===
                "Profile" && (
                <Profile
                  user={
                    currentUser
                  }
                  onSave={async form => {
                    const updated =
                      await saveProfile(
                        form
                      );

                    if (updated) {
                      setCurrentUser(
                        updated
                      );
                    }
                  }}
                />
              )}

              {page ===
                "Settings" && (
                <SettingsPage />
              )}

            </>

          )}

        </div>

      </main>

      {/* MEDICINE MODAL */}

      {showMed && (
        <Modal
          title="Add medicine"
          icon={<Pill />}
          onClose={() =>
            setShowMed(false)
          }
        >
          <MedicineForm
            onSave={
              saveMedicine
            }
            onCancel={() =>
              setShowMed(false)
            }
          />
        </Modal>
      )}

      {/* PRESCRIPTION MODAL */}

      {showRx && (
        <Modal
          title="Add prescription"
          icon={<FileText />}
          onClose={() =>
            setShowRx(false)
          }
        >
          <PrescriptionForm
            onSave={
              savePrescription
            }
            onCancel={() =>
              setShowRx(false)
            }
          />
        </Modal>
      )}

      {/* REMINDER MODAL */}

      {showReminder && (
        <Modal
          title="Save medication reminder"
          icon={<Bell />}
          onClose={() =>
            setShowReminder(false)
          }
          wide
        >
          <ReminderForm
            onSave={
              saveReminder
            }
            onCancel={() =>
              setShowReminder(false)
            }
          />
        </Modal>
      )}

      {/* NORMAL TOAST */}

      {toast && (
        <div className="toast">
          <CheckCircle2 size={19} />
          {toast}
        </div>
      )}

      {/* FAKE REMINDER POPUP */}

      {dueReminder && (
        <ReminderAlert
          reminder={dueReminder}
          onClose={() =>
            remindMeLater(
              dueReminder
            )
          }
          onTaken={() =>
            markReminder(
              dueReminder.id
            )
          }
        />
      )}

    </div>
  );
}

/* =========================================================
   REMINDER ALERT
========================================================= */

function ReminderAlert({
  reminder,
  onClose,
  onTaken
}) {
  return (
    <div className="reminderAlertOverlay">

      <div className="reminderAlert">

        <div className="reminderAlertIcon">
          <Bell size={28} />
        </div>

        <p className="eyebrow">
          MEDIVAULT REMINDER
        </p>

        <h2>
          It’s time for your medicine
        </h2>

        <div className="reminderAlertMedicine">

          <Pill size={20} />

          <div>

            <b>
              {reminder.medicine_name ||
                "Medicine reminder"}
            </b>

            <span>
              {reminder.dose ||
                "Dose not added"}
            </span>

          </div>

        </div>

        {reminder.frequency && (
          <p className="reminderAlertMeta">
            Frequency:{" "}
            {reminder.frequency}
          </p>
        )}

        {reminder.notes && (
          <p className="reminderAlertMeta">
            Note:{" "}
            {reminder.notes}
          </p>
        )}

        <div className="reminderAlertActions">

          <button
            className="secondary"
            onClick={onClose}
          >
            Remind me later
          </button>

          <button
            className="primary"
            onClick={onTaken}
          >
            <Check size={16} />
            Mark as taken
          </button>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  user,
  meds,
  prescriptions,
  reminders,
  onAdd,
  onRx,
  onReminder,
  onPage
}) {
  const safeMeds =
    asArray(meds);

  const safePrescriptions =
    asArray(prescriptions);

  const safeReminders =
    asArray(reminders);

  const active =
    safeMeds.filter(
      medicine =>
        String(
          medicine.status
        ).toLowerCase() ===
        "active"
    ).length;

  const pending =
    safeReminders.filter(
      reminder =>
        String(
          reminder.status
        ).toLowerCase() !==
        "completed"
    ).length;

  return (
    <div>

      <section className="welcome">

        <div>

          <p className="eyebrow">
            <Sparkles size={14} />
            YOUR HEALTH WORKSPACE
          </p>

          <h1>
            Good morning,{" "}
            {(user.name ||
              "there")
              .split(" ")[0]}{" "}
            <span>👋</span>
          </h1>

          <p>
            Your saved health records
            are now connected to
            the database.
          </p>

        </div>

        <div className="datePill">

          <CalendarDays size={17} />

          {new Date().toLocaleDateString(
            "en-IN",
            {
              day: "2-digit",
              month: "short",
              year: "numeric"
            }
          )}

        </div>

      </section>

      <div className="stats">

        <Stat
          icon={<Pill />}
          label="Active medicines"
          value={active}
          detail="Saved in database"
          cls="teal"
        />

        <Stat
          icon={<FileText />}
          label="Prescriptions"
          value={
            safePrescriptions.length
          }
          detail="Stored records"
          cls="purple"
        />

        <Stat
          icon={<Bell />}
          label="Pending reminders"
          value={pending}
          detail="Saved schedules"
          cls="orange"
        />

        <Stat
          icon={<Activity />}
          label="History entries"
          value={
            safeReminders.length
          }
          detail="Reminder records"
          cls="blue"
        />

      </div>

      <div className="gridMain">

        <section className="panel schedule">

          <PanelHead
            title="Saved reminders"
            sub="Your medication schedule"
            action="View all"
            onAction={() =>
              onPage("Reminders")
            }
          />

          {safeReminders
            .slice(0, 4)
            .map(reminder => (
              <TimeRow
                key={reminder.id}
                time={`${reminder.reminder_date || "No date"} · ${
                  reminder.reminder_time || "No time"
                }`}
                name={
                  reminder.medicine_name ||
                  "Medicine reminder"
                }
                dose={`${reminder.dose || "Dose not added"} · ${
                  reminder.frequency ||
                  "As needed"
                }`}
                done={
                  String(
                    reminder.status
                  ).toLowerCase() ===
                  "completed"
                }
              />
            ))}

          {!safeReminders.length && (
            <div className="emptyState">

              <Bell size={22} />

              <div>
                No reminders saved yet.
              </div>

            </div>
          )}

        </section>

        <section className="panel quick">

          <PanelHead
            title="Quick actions"
            sub="Manage your health records"
          />

          <button
            onClick={onReminder}
          >
            <span className="actionIcon orangeBg">
              <Bell />
            </span>

            <div>
              <b>
                Save reminder
              </b>

              <small>
                Set a dose before
                taking medicine
              </small>
            </div>

            <ChevronRight />
          </button>

          <button
            onClick={onAdd}
          >
            <span className="actionIcon tealBg">
              <Plus />
            </span>

            <div>
              <b>
                Add medicine
              </b>

              <small>
                Save a medication
              </small>
            </div>

            <ChevronRight />
          </button>

          <button
            onClick={onRx}
          >
            <span className="actionIcon purpleBg">
              <FileText />
            </span>

            <div>
              <b>
                Save prescription
              </b>

              <small>
                Keep prescription details
              </small>
            </div>

            <ChevronRight />
          </button>

        </section>

      </div>

      <div className="gridBottom">

        <section className="panel">

          <PanelHead
            title="Recent prescriptions"
            sub="Saved medical records"
            action="See all"
            onAction={() =>
              onPage(
                "Prescriptions"
              )
            }
          />

          {safePrescriptions
            .slice(0, 3)
            .map(prescription => (
              <div
                className="rxRow"
                key={prescription.id}
              >

                <div className="rxIcon">
                  <FileText size={18} />
                </div>

                <div className="grow">

                  <b>
                    {prescription.doctor ||
                      "Doctor"}
                  </b>

                  <span>
                    {prescription.diagnosis ||
                      "No diagnosis"}{" "}
                    ·{" "}
                    {
                      prescription.medicines_count ??
                      0
                    }{" "}
                    medicine
                    {
                      Number(
                        prescription.medicines_count
                      ) > 1
                        ? "s"
                        : ""
                    }
                  </span>

                </div>

                <div className="rxDate">
                  {
                    prescription.prescription_date ||
                    "—"
                  }
                </div>

                <span className="status active">
                  Saved
                </span>

              </div>
            ))}

          {!safePrescriptions.length && (
            <div className="emptyState">
              No prescriptions saved yet.
            </div>
          )}

        </section>

        <section className="panel healthTip">

          <div className="tipTop">

            <span>
              <Stethoscope size={18} />
            </span>

            <b>
              Connected database
            </b>

          </div>

          <h3>
            Your records persist after
            refresh.
          </h3>

          <p>
            Login, medicines,
            prescriptions and
            reminders are linked to
            your user account and
            stored in MySQL.
          </p>

          <button
            onClick={() =>
              onPage("Profile")
            }
          >
            View profile
            <ChevronRight size={15} />
          </button>

        </section>

      </div>

    </div>
  );
}

/* =========================================================
   MEDICINES
========================================================= */

function Medicines({
  meds,
  onAdd,
  onDelete
}) {
  const safeMeds =
    asArray(meds);

  return (
    <div>

      <PageTitle
        title="Medicines"
        desc="Manage medications saved for your account."
        button="Add medicine"
        onClick={onAdd}
      />

      <section className="panel tablePanel">

        <div className="tableTop">

          <div>
            <b>
              Medication list
            </b>

            <span>
              {safeMeds.length} records
            </span>
          </div>

        </div>

        <div className="tableWrap">

          <table>

            <thead>
              <tr>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Reminder</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>

              {safeMeds.map(
                medicine => (
                  <tr
                    key={
                      medicine.id
                    }
                  >

                    <td>

                      <div className="medCell">

                        <span
                          className={`medIcon ${
                            medicine.color ||
                            "teal"
                          }`}
                        >
                          <Pill size={17} />
                        </span>

                        <b>
                          {medicine.name ||
                            "Unnamed medicine"}
                        </b>

                      </div>

                    </td>

                    <td>
                      {medicine.dose ||
                        "—"}
                    </td>

                    <td>
                      {medicine.frequency ||
                        "—"}
                    </td>

                    <td>
                      {medicine.time ||
                        "—"}
                    </td>

                    <td>

                      <span className="status active">
                        {medicine.status ||
                          "Active"}
                      </span>

                    </td>

                    <td>

                      <button
                        className="tiny"
                        onClick={() =>
                          onDelete(
                            medicine.id
                          )
                        }
                      >
                        <Trash2 size={16} />
                      </button>

                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

          {!safeMeds.length && (
            <div className="emptyState">
              No medicines found.
            </div>
          )}

        </div>

      </section>

    </div>
  );
}

/* =========================================================
   PRESCRIPTIONS
========================================================= */

function Prescriptions({
  data,
  onAdd
}) {
  const safeData =
    asArray(data);

  return (
    <div>

      <PageTitle
        title="Prescriptions"
        desc="Store and review your prescription records."
        button="Add prescription"
        onClick={onAdd}
      />

      <div className="rxCards">

        {safeData.map(
          prescription => (
            <div
              className="rxCard panel"
              key={prescription.id}
            >

              <div className="rxCardHead">

                <div className="rxIcon big">
                  <FileText />
                </div>

                <span className="status active">
                  Saved
                </span>

              </div>

              <h3>
                {prescription.doctor ||
                  "Doctor"}
              </h3>

              <p>
                {prescription.diagnosis ||
                  "No diagnosis added"}
              </p>

              <div className="rxMeta">

                <span>
                  <CalendarDays size={15} />

                  {
                    prescription.prescription_date ||
                    "—"
                  }
                </span>

                <span>
                  <Pill size={15} />

                  {
                    prescription.medicines_count ??
                    0
                  }{" "}
                  medicines
                </span>

              </div>

            </div>
          )
        )}

        {!safeData.length && (
          <div className="panel emptyState">
            No prescriptions saved yet.
          </div>
        )}

      </div>

    </div>
  );
}

/* =========================================================
   REMINDERS PAGE
========================================================= */

function Reminders({
  reminders,
  onAdd,
  onComplete,
  onDelete
}) {
  const safeReminders =
    asArray(reminders);

  const completedCount =
    safeReminders.filter(
      reminder =>
        String(
          reminder.status
        ).toLowerCase() ===
        "completed"
    ).length;

  const percentage =
    safeReminders.length
      ? Math.round(
          (completedCount /
            safeReminders.length) *
            100
        )
      : 0;

  return (
    <div>

      <PageTitle
        title="Medication reminders"
        desc="Save reminders first, then mark doses as taken."
        button="Save reminder"
        onClick={onAdd}
      />

      <div className="reminderHero panel">

        <div className="bigBell">
          <Bell />
        </div>

        <div>

          <p className="eyebrow">
            DATABASE-BACKED REMINDERS
          </p>

          <h2>
            {completedCount} of{" "}
            {safeReminders.length}{" "}
            completed
          </h2>

          <div className="progress">

            <span
              style={{
                width: `${percentage}%`
              }}
            />

          </div>

          <small>
            Reminders are saved to
            MySQL for your account.
          </small>

        </div>

        <div className="progressPct">
          {percentage}%
        </div>

      </div>

      <section className="panel reminderList">

        <PanelHead
          title="Saved reminders"
          sub="Your stored medication schedule"
        />

        {safeReminders.map(
          reminder => (
            <div
              className="reminderRow"
              key={reminder.id}
            >

              <div className="timeCol">

                <b>
                  {reminder.reminder_time ||
                    "—"}
                </b>

                <span>
                  {reminder.reminder_date ||
                    "—"}
                </span>

              </div>

              <div className="medIcon teal">
                <Pill size={18} />
              </div>

              <div className="grow">

                <b>
                  {reminder.medicine_name ||
                    "Medicine reminder"}
                </b>

                <span>

                  {reminder.dose ||
                    "Dose not added"}

                  {" · "}

                  {reminder.frequency ||
                    "As needed"}

                  {reminder.notes
                    ? ` · ${reminder.notes}`
                    : ""}

                </span>

              </div>

              {String(
                reminder.status
              ).toLowerCase() ===
              "completed" ? (

                <span className="status completed">
                  Taken
                </span>

              ) : (

                <button
                  className="checkBtn"
                  onClick={() =>
                    onComplete(
                      reminder.id
                    )
                  }
                >
                  <Check size={17} />
                  Mark taken
                </button>

              )}

              <button
                className="tiny"
                onClick={() =>
                  onDelete(
                    reminder.id
                  )
                }
              >
                <Trash2 size={16} />
              </button>

            </div>
          )
        )}

        {!safeReminders.length && (
          <div className="emptyState">

            <Bell size={22} />

            <div>
              No reminders saved yet.
              Click “Save reminder” to
              create the first one.
            </div>

          </div>
        )}

      </section>

    </div>
  );
}

/* =========================================================
   HISTORY
========================================================= */

function HistoryPage({
  history
}) {
  const safeHistory =
    asArray(history);

  return (
    <div>

      <PageTitle
        title="Medication history"
        desc="Previous reminder activity saved for your account."
      />

      <section className="panel historyPanel">

        {safeHistory.map(
          item => (
            <div
              className="historyItem"
              key={item.id}
            >

              <div className="historyDot">
                <History size={16} />
              </div>

              <div>

                <span>
                  {item.action_date ||
                    "—"}
                </span>

                <h3>
                  {item.medicine_name ||
                    "Medicine"}
                </h3>

                <p>
                  {item.action ||
                    "Activity"}
                </p>

              </div>

              <span
                className={`status ${
                  item.action === "Taken"
                    ? "active"
                    : "completed"
                }`}
              >
                {item.action}
              </span>

            </div>
          )
        )}

        {!safeHistory.length && (
          <div className="emptyState">
            No history yet.
          </div>
        )}

      </section>

    </div>
  );
}

/* =========================================================
   PROFILE
========================================================= */

function Profile({
  user,
  onSave
}) {
  const [name, setName] =
    useState(
      user?.name || ""
    );

  const [phone, setPhone] =
    useState(
      String(user?.phone || "")
        .replace(/^\+91/, "")
    );

  const [saving, setSaving] =
    useState(false);

  async function submit(event) {
    event.preventDefault();

    setSaving(true);

    const updated =
      await onSave({
        name,
        phone
      });

    if (updated) {

      setName(
        updated.name || ""
      );

      setPhone(
        String(
          updated.phone || ""
        ).replace(
          /^\+91/,
          ""
        )
      );
    }

    setSaving(false);
  }

  return (
    <div>

      <PageTitle
        title="My profile"
        desc="Your account information and reminder phone number."
      />

      <section className="panel profile">

        <div className="profileAvatar">

          {name
            .split(" ")
            .map(
              part => part[0]
            )
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase()}

        </div>

        <div className="profileInfo">

          <h2>
            {name}
          </h2>

          <p>
            MediVault member
          </p>

          <form
            onSubmit={submit}
          >

            <div className="profileGrid">

              <Field
                label="Full name"
                name="name"
                value={name}
                onChange={event =>
                  setName(
                    event.target.value
                  )
                }
                required
              />

              <Field
                label="Registered mobile number"
                name="phone"
                type="tel"
                value={phone}
                onChange={event =>
                  setPhone(
                    event.target.value
                      .replace(
                        /\D/g,
                        ""
                      )
                      .slice(
                        0,
                        10
                      )
                  )
                }
                placeholder="10-digit mobile number"
                required
              />

              <Info
                label="Email"
                value={
                  user?.email ||
                  "—"
                }
              />

              <Info
                label="Account created"
                value={
                  user?.created_at
                    ? new Date(
                        user.created_at
                      ).toLocaleDateString(
                        "en-IN"
                      )
                    : "—"
                }
              />

            </div>

            <div className="modalActions">

              <button
                className="primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save profile"}
              </button>

            </div>

          </form>

        </div>

      </section>

    </div>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function SettingsPage() {
  return (
    <div>

      <PageTitle
        title="Settings"
        desc="MediVault shows medication reminders inside the app when a saved reminder is due."
      />

      <section className="panel settings">

        <Setting
          title="In-app medication reminders"
          desc="A reminder popup appears inside MediVault when the saved date and time are reached."
          on
        />

        <Setting
          title="Privacy mode"
          desc="Only authenticated users can access their own records."
          on
        />

      </section>

    </div>
  );
}

/* =========================================================
   SETTING
========================================================= */

function Setting({
  title,
  desc,
  on = false
}) {
  const [value, setValue] =
    useState(on);

  return (
    <div className="setting">

      <div>

        <b>
          {title}
        </b>

        <span>
          {desc}
        </span>

      </div>

      <button
        type="button"
        className={`switch ${
          value ? "on" : ""
        }`}
        onClick={() =>
          setValue(!value)
        }
      >
        <i />
      </button>

    </div>
  );
}

/* =========================================================
   INFO
========================================================= */

function Info({
  label,
  value
}) {
  return (
    <div>

      <span>
        {label}
      </span>

      <b>
        {value}
      </b>

    </div>
  );
}

/* =========================================================
   PAGE TITLE
========================================================= */

function PageTitle({
  title,
  desc,
  button,
  onClick
}) {
  return (
    <section className="pageTitle">

      <div>

        <p className="eyebrow">
          MEDIVAULT
        </p>

        <h1>
          {title}
        </h1>

        <p>
          {desc}
        </p>

      </div>

      {button && (
        <button
          className="primary"
          onClick={onClick}
        >
          <Plus size={17} />
          {button}
        </button>
      )}

    </section>
  );
}

/* =========================================================
   PANEL HEAD
========================================================= */

function PanelHead({
  title,
  sub,
  action,
  onAction
}) {
  return (
    <div className="panelHead">

      <div>

        <h2>
          {title}
        </h2>

        <p>
          {sub}
        </p>

      </div>

      {action && (
        <button
          onClick={onAction}
        >
          {action}
          <ChevronRight size={15} />
        </button>
      )}

    </div>
  );
}

/* =========================================================
   STAT
========================================================= */

function Stat({
  icon,
  label,
  value,
  detail,
  cls
}) {
  return (
    <div className="stat">

      <div
        className={`statIcon ${cls}`}
      >
        {icon}
      </div>

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {detail}
        </small>

      </div>

    </div>
  );
}

/* =========================================================
   TIME ROW
========================================================= */

function TimeRow({
  time,
  name,
  dose,
  done
}) {
  return (
    <div className="timeRow">

      <div className="time">

        <b>
          {time}
        </b>

        <span>
          {done
            ? "Completed"
            : "Scheduled"}
        </span>

      </div>

      <div
        className={`timeDot ${
          done
            ? "done"
            : "now"
        }`}
      >
        {done ? (
          <Check size={13} />
        ) : (
          <Clock3 size={13} />
        )}
      </div>

      <div className="dose">

        <b>
          {name}
        </b>

        <span>
          {dose}
        </span>

      </div>

      {done ? (

        <span className="taken">
          <Check size={14} />
          Taken
        </span>

      ) : (

        <span className="due">
          Saved
        </span>

      )}

    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  name,
  placeholder,
  type = "text",
  required,
  value,
  onChange,
  icon
}) {
  return (
    <label className="field">

      <span>
        {label}
      </span>

      <div className="inputWithIcon">

        {icon}

        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          value={value ?? ""}
          onChange={onChange}
        />

      </div>

    </label>
  );
}

/* =========================================================
   MODAL
========================================================= */

function Modal({
  title,
  icon,
  onClose,
  children,
  wide = false
}) {
  return (
    <div className="overlay">

      <div
        className={`modal ${
          wide ? "wide" : ""
        }`}
      >

        <div className="modalHead">

          <div>

            <span className="modalIcon">
              {icon}
            </span>

            <h2>
              {title}
            </h2>

          </div>

          <button
            type="button"
            onClick={onClose}
          >
            <X />
          </button>

        </div>

        {children}

      </div>

    </div>
  );
}

/* =========================================================
   MEDICINE FORM
========================================================= */

function MedicineForm({
  onSave,
  onCancel
}) {
  const [form, setForm] =
    useState({
      name: "",
      dose: "",
      frequency: "",
      time: "",
      duration: ""
    });

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        onSave(form);
      }}
    >

      <div className="formGrid">

        {[
          [
            "name",
            "Medicine name",
            "e.g. Amoxicillin"
          ],
          [
            "dose",
            "Dosage",
            "e.g. 500 mg"
          ],
          [
            "frequency",
            "Frequency",
            "e.g. Twice daily"
          ],
          [
            "time",
            "Reminder time",
            "e.g. 08:00 AM"
          ],
          [
            "duration",
            "Duration",
            "e.g. 7 days"
          ]
        ].map(
          ([key, label, placeholder]) => (
            <Field
              key={key}
              label={label}
              name={key}
              placeholder={
                placeholder
              }
              required
              value={
                form[key]
              }
              onChange={event =>
                setForm({
                  ...form,
                  [key]:
                    event.target
                      .value
                })
              }
            />
          )
        )}

      </div>

      <div className="modalActions">

        <button
          type="button"
          className="secondary"
          onClick={onCancel}
        >
          Cancel
        </button>

        <button className="primary">
          Save medicine
        </button>

      </div>

    </form>
  );
}

/* =========================================================
   PRESCRIPTION FORM
========================================================= */

function PrescriptionForm({
  onSave,
  onCancel
}) {
  const [form, setForm] =
    useState({
      doctor: "",
      prescription_date:
        new Date()
          .toISOString()
          .slice(0, 10),
      diagnosis: "",
      medicines_count: 1
    });

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        onSave(form);
      }}
    >

      <div className="formGrid">

        {[
          [
            "doctor",
            "Doctor",
            "e.g. Dr. Ananya Rao"
          ],
          [
            "prescription_date",
            "Prescription date",
            "YYYY-MM-DD"
          ],
          [
            "diagnosis",
            "Diagnosis / notes",
            "e.g. Seasonal infection"
          ],
          [
            "medicines_count",
            "Number of medicines",
            "e.g. 2"
          ]
        ].map(
          ([key, label, placeholder]) => (
            <Field
              key={key}
              label={label}
              name={key}
              placeholder={
                placeholder
              }
              type={
                key ===
                "medicines_count"
                  ? "number"
                  : "text"
              }
              required
              value={
                form[key]
              }
              onChange={event =>
                setForm({
                  ...form,
                  [key]:
                    event.target
                      .value
                })
              }
            />
          )
        )}

      </div>

      <div className="modalActions">

        <button
          type="button"
          className="secondary"
          onClick={onCancel}
        >
          Cancel
        </button>

        <button className="primary">
          Save prescription
        </button>

      </div>

    </form>
  );
}

/* =========================================================
   REMINDER FORM
========================================================= */

function ReminderForm({
  onSave,
  onCancel
}) {
  const [form, setForm] =
    useState({
      medicine_name: "",
      dose: "",
      frequency: "",
      reminder_date:
        new Date()
          .toISOString()
          .slice(0, 10),
      reminder_time: "08:00",
      notes: ""
    });

  function updateField(
    field,
    value
  ) {
    setForm(previous => ({
      ...previous,
      [field]: value
    }));
  }

  return (
    <form
      onSubmit={event => {
        event.preventDefault();

        if (
          !form.medicine_name.trim()
        ) {
          return;
        }

        if (
          !form.reminder_date
        ) {
          return;
        }

        if (
          !form.reminder_time
        ) {
          return;
        }

        onSave(form);
      }}
    >

      <div className="formGrid reminderForm">

        <Field
          label="Medicine / reminder name"
          name="medicine_name"
          placeholder="e.g. Paracetamol"
          required
          value={
            form.medicine_name
          }
          onChange={event =>
            updateField(
              "medicine_name",
              event.target.value
            )
          }
        />

        <Field
          label="Dose"
          name="dose"
          placeholder="e.g. 500 mg"
          value={
            form.dose
          }
          onChange={event =>
            updateField(
              "dose",
              event.target.value
            )
          }
        />

        <Field
          label="Frequency"
          name="frequency"
          placeholder="e.g. Twice daily"
          value={
            form.frequency
          }
          onChange={event =>
            updateField(
              "frequency",
              event.target.value
            )
          }
        />

        <Field
          label="Date"
          name="reminder_date"
          type="date"
          required
          value={
            form.reminder_date
          }
          onChange={event =>
            updateField(
              "reminder_date",
              event.target.value
            )
          }
        />

        <Field
          label="Time"
          name="reminder_time"
          type="time"
          required
          value={
            form.reminder_time
          }
          onChange={event =>
            updateField(
              "reminder_time",
              event.target.value
            )
          }
        />

        <Field
          label="Notes"
          name="notes"
          placeholder="e.g. After breakfast"
          value={
            form.notes
          }
          onChange={event =>
            updateField(
              "notes",
              event.target.value
            )
          }
        />

      </div>

      <div className="modalActions">

        <button
          type="button"
          className="secondary"
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="primary"
        >
          Save reminder
        </button>

      </div>

    </form>
  );
}

/* =========================================================
   START REACT
========================================================= */

const rootElement =
  document.getElementById(
    "root"
  );

if (!rootElement) {
  throw new Error(
    "MediVault root element was not found."
  );
}

createRoot(rootElement).render(
  <App />
);