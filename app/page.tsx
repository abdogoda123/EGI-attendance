"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";

type Page = "home" | "doctor" | "student" | "admin";

type Attendance = {
  id: string;
  studentName: string;
  studentCode: string;
  department: string;
  level: string;
  subject: string;
  room: string;
  time: string;
  latitude: number;
  longitude: number;
  distance: number;
  status: "حاضر" | "مرفوض";
};

const INSTITUTE =
  "معهد الجزيرة العالي للهندسة والتكنولوجيا";

const DEPARTMENTS = [
  "هندسة الاتصالات والإلكترونيات",
  "الهندسة المدنية",
  "الهندسة المعمارية",
  "الإعدادي",
];

const LEVELS = [
  "الأول",
  "الثاني",
  "الثالث",
  "الرابع",
  "الخامس",
];

const SESSION_TYPES = [
  "محاضرة",
  "تمرين",
  "سكشن",
  "عملي",
];

function distanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Page() {
  const [page, setPage] = useState<Page>("home");

  const [attendances, setAttendances] = useState<Attendance[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("attendance-data");

      if (saved) {
        setAttendances(JSON.parse(saved));
      }
    } catch {
      setAttendances([]);
    }
  }, []);

  function saveAttendance(data: Attendance) {
    const next = [data, ...attendances];

    setAttendances(next);

    localStorage.setItem(
      "attendance-data",
      JSON.stringify(next)
    );
  }

  return (
    <main style={styles.main}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>{INSTITUTE}</h1>

          <p style={styles.subtitle}>
            نظام الحضور والغياب الإلكتروني
          </p>
        </div>
      </header>

      {page === "home" && (
        <HomePage setPage={setPage} />
      )}

      {page === "doctor" && (
        <DoctorPage
          onBack={() => setPage("home")}
        />
      )}

      {page === "student" && (
        <StudentPage
          onBack={() => setPage("home")}
          onAttendance={saveAttendance}
        />
      )}

      {page === "admin" && (
        <AdminPage
          onBack={() => setPage("home")}
          attendances={attendances}
        />
      )}

      <div style={styles.developerCard}>
        <div>👨‍💻 إعداد وتطوير النظام</div>
        <strong>عبد الرحمن جودة منصور</strong>
        <div>
          المستوى الثاني — قسم هندسة الاتصالات والإلكترونيات
        </div>
      </div>
    </main>
  );
}

/* =========================
   HOME
========================= */

function HomePage({
  setPage,
}: {
  setPage: (page: Page) => void;
}) {
  return (
    <section style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.logo}>🎓</div>

        <h2 style={styles.heroTitle}>
          نظام الحضور الذكي
        </h2>

        <p style={styles.heroText}>
          تسجيل حضور الطلاب باستخدام QR Code
          والتحقق من الوقت والموقع.
        </p>
      </div>

      <div style={styles.grid}>
        <RoleCard
          icon="👨‍💼"
          title="الإدارة"
          text="متابعة الحضور والتقارير"
          onClick={() => setPage("admin")}
        />

        <RoleCard
          icon="👨‍🏫"
          title="الدكتور"
          text="إنشاء جلسة حضور وعرض QR"
          onClick={() => setPage("doctor")}
        />

        <RoleCard
          icon="🎓"
          title="الطالب"
          text="مسح QR وتسجيل الحضور"
          onClick={() => setPage("student")}
        />

        <RoleCard
          icon="📊"
          title="التقارير"
          text="عرض سجلات الحضور"
          onClick={() => setPage("admin")}
        />
      </div>
    </section>
  );
}

function RoleCard({
  icon,
  title,
  text,
  onClick,
}: {
  icon: string;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={styles.roleCard}
    >
      <div style={styles.roleIcon}>{icon}</div>

      <h3 style={styles.roleTitle}>{title}</h3>

      <p style={styles.roleText}>{text}</p>
    </button>
  );
}

/* =========================
   DOCTOR
========================= */

function DoctorPage({
  onBack,
}: {
  onBack: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [department, setDepartment] = useState(
    DEPARTMENTS[0]
  );
  const [level, setLevel] = useState(LEVELS[1]);
  const [room, setRoom] = useState("");
  const [sessionType, setSessionType] = useState(
    SESSION_TYPES[0]
  );

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState("100");

  const [session, setSession] = useState<{
    id: string;
    expiresAt: number;
  } | null>(null);

  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!session) return;

    const timer = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((session.expiresAt - Date.now()) / 1000)
      );

      setSeconds(remaining);

      if (remaining <= 0) {
        setSession(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  function startSession() {
    if (!subject.trim()) {
      alert("اكتب اسم المادة أولاً");
      return;
    }

    if (!room.trim()) {
      alert("اكتب رقم المدرج أو القاعة");
      return;
    }

    if (!latitude || !longitude) {
      alert("اكتب إحداثيات مكان المحاضرة");
      return;
    }

    const id =
      Date.now().toString() +
      "-" +
      Math.random().toString(36).slice(2);

    const expiresAt = Date.now() + 60 * 1000;

    setSession({
      id,
      expiresAt,
    });

    setSeconds(60);
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      alert("المتصفح لا يدعم تحديد الموقع");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(
          position.coords.latitude.toFixed(6)
        );

        setLongitude(
          position.coords.longitude.toFixed(6)
        );
      },
      () => {
        alert("لم نتمكن من الحصول على الموقع");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  return (
    <section style={styles.container}>
      <button
        onClick={onBack}
        style={styles.backButton}
      >
        ← الرئيسية
      </button>

      <div style={styles.panel}>
        <h2 style={styles.sectionTitle}>
          👨‍🏫 لوحة الدكتور
        </h2>

        {!session ? (
          <>
            <div style={styles.formGrid}>
              <Input
                label="اسم المادة"
                value={subject}
                onChange={setSubject}
                placeholder="مثال: شبكات الحاسب"
              />

              <Input
                label="القاعة / المدرج"
                value={room}
                onChange={setRoom}
                placeholder="مثال: مدرج 3"
              />

              <Select
                label="القسم"
                value={department}
                onChange={setDepartment}
                options={DEPARTMENTS}
              />

              <Select
                label="المستوى"
                value={level}
                onChange={setLevel}
                options={LEVELS}
              />

              <Select
                label="نوع المحاضرة"
                value={sessionType}
                onChange={setSessionType}
                options={SESSION_TYPES}
              />
            </div>

            <div style={styles.locationBox}>
              <h3>📍 موقع المحاضرة</h3>

              <Input
                label="خط العرض Latitude"
                value={latitude}
                onChange={setLatitude}
                placeholder="مثال: 30.123456"
              />

              <Input
                label="خط الطول Longitude"
                value={longitude}
                onChange={setLongitude}
                placeholder="مثال: 31.123456"
              />

              <Input
                label="نطاق السماح بالمتر"
                value={radius}
                onChange={setRadius}
                placeholder="100"
              />

              <button
                onClick={getCurrentLocation}
                style={styles.secondaryButton}
              >
                📍 استخدام موقعي الحالي
              </button>
            </div>

            <button
              onClick={startSession}
              style={styles.primaryButton}
            >
              🚀 بدء جلسة الحضور
            </button>
          </>
        ) : (
          <div style={styles.sessionBox}>
            <h2>🟢 جلسة الحضور تعمل</h2>

            <p>
              المادة: <strong>{subject}</strong>
            </p>

            <p>
              القسم: <strong>{department}</strong>
            </p>

            <p>
              المستوى: <strong>{level}</strong>
            </p>

            <p>
              القاعة: <strong>{room}</strong>
            </p>

            <div style={styles.timer}>
              {seconds} ثانية
            </div>

            <div style={styles.qrWrapper}>
              <QRCodeSVG
                value={JSON.stringify({
                  type: "JAZEERA_ATTENDANCE",
                  sessionId: session.id,
                  subject,
                  room,
                  department,
                  level,
                  sessionType,
                  latitude: Number(latitude),
                  longitude: Number(longitude),
                  radius: Number(radius),
                  expiresAt: session.expiresAt,
                })}
                size={260}
                level="H"
              />
            </div>

            <p style={styles.warning}>
              ⚠️ هذا الكود يتغير بانتهاء الجلسة.
            </p>

            <button
              onClick={() => setSession(null)}
              style={styles.dangerButton}
            >
              إيقاف الجلسة
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================
   STUDENT
========================= */

function StudentPage({
  onBack,
  onAttendance,
}: {
  onBack: () => void;
  onAttendance: (data: Attendance) => void;
}) {
  const [studentName, setStudentName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [department, setDepartment] = useState(
    DEPARTMENTS[0]
  );
  const [level, setLevel] = useState(LEVELS[1]);

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);

  async function stopScanner() {
    try {
      if (scannerRef.current) {
        const scanner = scannerRef.current;

        if (scanner.isScanning) {
          await scanner.stop();
        }

        scanner.clear();
        scannerRef.current = null;
      }
    } catch {
      // تجاهل الخطأ عند إغلاق الكاميرا
    }

    setScanning(false);
  }

  async function startScanner() {
    if (!studentName.trim()) {
      alert("اكتب اسم الطالب");
      return;
    }

    if (!studentCode.trim()) {
      alert("اكتب كود الطالب");
      return;
    }

    setResult("");
    setStatus("");

    try {
      const scanner = new Html5Qrcode(
        "reader"
      );

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
        },
        async (decodedText) => {
          await processQr(decodedText);
          await stopScanner();
        },
        () => {}
      );

      setScanning(true);
    } catch {
      alert(
        "تعذر فتح الكاميرا. تأكد من السماح للمتصفح باستخدام الكاميرا."
      );

      setScanning(false);
    }
  }

  async function processQr(decodedText: string) {
    try {
      const qr = JSON.parse(decodedText);

      if (qr.type !== "JAZEERA_ATTENDANCE") {
        setStatus("❌ كود QR غير تابع للنظام");
        return;
      }

      if (Date.now() > qr.expiresAt) {
        setStatus("❌ انتهت صلاحية جلسة الحضور");
        return;
      }

      if (!navigator.geolocation) {
        setStatus(
          "❌ جهازك لا يدعم تحديد الموقع"
        );
        return;
      }

      setStatus("📍 جاري التحقق من موقعك...");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          const distance = distanceInMeters(
            lat,
            lon,
            Number(qr.latitude),
            Number(qr.longitude)
          );

          if (distance > Number(qr.radius)) {
            setStatus(
              `❌ تم رفض الحضور. أنت خارج نطاق المحاضرة (${Math.round(
                distance
              )} متر)`
            );
            return;
          }

          const attendance: Attendance = {
            id:
              Date.now().toString() +
              "-" +
              Math.random().toString(36).slice(2),
            studentName,
            studentCode,
            department,
            level,
            subject: qr.subject,
            room: qr.room,
            time: new Date().toLocaleString(
              "ar-EG"
            ),
            latitude: lat,
            longitude: lon,
            distance,
            status: "حاضر",
          };

          onAttendance(attendance);

          setStatus(
            `✅ تم تسجيل حضورك بنجاح — المسافة ${Math.round(
              distance
            )} متر`
          );
        },
        () => {
          setStatus(
            "❌ يجب السماح للموقع حتى يتم تسجيل الحضور"
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch {
      setStatus("❌ QR غير صالح");
    }
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {});
      }
    };
  }, []);

  return (
    <section style={styles.container}>
      <button
        onClick={onBack}
        style={styles.backButton}
      >
        ← الرئيسية
      </button>

      <div style={styles.panel}>
        <h2 style={styles.sectionTitle}>
          🎓 تسجيل حضور الطالب
        </h2>

        {!scanning && !result && (
          <>
            <Input
              label="اسم الطالب"
              value={studentName}
              onChange={setStudentName}
              placeholder="اكتب اسمك"
            />

            <Input
              label="كود الطالب"
              value={studentCode}
              onChange={setStudentCode}
              placeholder="مثال: 20260001"
            />

            <Select
              label="القسم"
              value={department}
              onChange={setDepartment}
              options={DEPARTMENTS}
            />

            <Select
              label="المستوى"
              value={level}
              onChange={setLevel}
              options={LEVELS}
            />
          </>
        )}

        <div
          id="reader"
          style={{
            ...styles.reader,
            display: scanning ? "block" : "none",
          }}
        />

        {!scanning && (
          <button
            onClick={startScanner}
            style={styles.primaryButton}
          >
            📷 فتح الكاميرا ومسح QR
          </button>
        )}

        {scanning && (
          <button
            onClick={stopScanner}
            style={styles.dangerButton}
          >
            إغلاق الكاميرا
          </button>
        )}

        {status && (
          <div style={styles.statusBox}>
            {status}
          </div>
        )}

        <div style={styles.securityBox}>
          <h3>🔐 التحقق الأمني</h3>

          <p>✓ الطالب مسجل بالاسم والكود</p>
          <p>✓ التحقق من صلاحية QR</p>
          <p>✓ التحقق من موقع الطالب</p>
          <p>✓ التحقق من نطاق القاعة</p>
          <p>✓ تسجيل وقت الحضور</p>
        </div>
      </div>
    </section>
  );
}

/* =========================
   ADMIN
========================= */

function AdminPage({
  onBack,
  attendances,
}: {
  onBack: () => void;
  attendances: Attendance[];
}) {
  return (
    <section style={styles.container}>
      <button
        onClick={onBack}
        style={styles.backButton}
      >
        ← الرئيسية
      </button>

      <div style={styles.panel}>
        <h2 style={styles.sectionTitle}>
          📊 لوحة الإدارة
        </h2>

        <div style={styles.stats}>
          <div style={styles.stat}>
            <strong>{attendances.length}</strong>
            <span>إجمالي الحضور</span>
          </div>

          <div style={styles.stat}>
            <strong>
              {
                attendances.filter(
                  (x) => x.status === "حاضر"
                ).length
              }
            </strong>
            <span>حضور صحيح</span>
          </div>

          <div style={styles.stat}>
            <strong>
              {
                attendances.filter(
                  (x) => x.status === "مرفوض"
                ).length
              }
            </strong>
            <span>مرفوض</span>
          </div>
        </div>

        {attendances.length === 0 ? (
          <div style={styles.empty}>
            لا توجد سجلات حضور حتى الآن.
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>الكود</th>
                  <th>المادة</th>
                  <th>القاعة</th>
                  <th>الوقت</th>
                  <th>المسافة</th>
                  <th>الحالة</th>
                </tr>
              </thead>

              <tbody>
                {attendances.map((item) => (
                  <tr key={item.id}>
                    <td>{item.studentName}</td>
                    <td>{item.studentCode}</td>
                    <td>{item.subject}</td>
                    <td>{item.room}</td>
                    <td>{item.time}</td>
                    <td>
                      {Math.round(item.distance)} م
                    </td>
                    <td>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================
   INPUTS
========================= */

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label style={styles.label}>
      <span>{label}</span>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        style={styles.input}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label style={styles.label}>
      <span>{label}</span>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        style={styles.input}
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

/* =========================
   STYLES
========================= */

const styles: {
  [key: string]: React.CSSProperties;
} = {
  main: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#07111f,#0d1b2e,#102a43)",
    color: "#fff",
    paddingBottom: 120,
    direction: "rtl",
    fontFamily:
      "Arial, Tahoma, sans-serif",
  },

  header: {
    padding: "25px 6%",
    borderBottom:
      "1px solid rgba(255,255,255,.1)",
    background:
      "rgba(0,0,0,.2)",
  },

  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#aab8c8",
    fontSize: 15,
  },

  container: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "35px 20px",
  },

  hero: {
    textAlign: "center",
    padding: "40px 20px",
  },

  logo: {
    fontSize: 60,
  },

  heroTitle: {
    fontSize: 40,
    margin: "15px 0",
  },

  heroText: {
    color: "#b7c3d0",
    fontSize: 18,
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: 20,
  },

  roleCard: {
    border: "1px solid rgba(255,255,255,.12)",
    background:
      "rgba(255,255,255,.06)",
    borderRadius: 20,
    padding: 30,
    color: "#fff",
    cursor: "pointer",
    textAlign: "center",
  },

  roleIcon: {
    fontSize: 45,
  },

  roleTitle: {
    fontSize: 23,
    margin: "15px 0 5px",
  },

  roleText: {
    color: "#aebdcd",
    margin: 0,
  },

  panel: {
    background:
      "rgba(255,255,255,.06)",
    border:
      "1px solid rgba(255,255,255,.12)",
    borderRadius: 22,
    padding: 25,
    backdropFilter: "blur(10px)",
  },

  sectionTitle: {
    marginTop: 0,
    fontSize: 28,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(250px,1fr))",
    gap: 18,
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 16,
    fontWeight: 700,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    borderRadius: 12,
    border:
      "1px solid rgba(255,255,255,.18)",
    background: "#101d2d",
    color: "#fff",
    fontSize: 16,
    outline: "none",
  },

  locationBox: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    background:
      "rgba(0,150,255,.08)",
    border:
      "1px solid rgba(0,150,255,.2)",
  },

  primaryButton: {
    width: "100%",
    marginTop: 20,
    padding: 16,
    border: 0,
    borderRadius: 14,
    background:
      "linear-gradient(90deg,#0077ff,#00a6ff)",
    color: "#fff",
    fontSize: 18,
    fontWeight: 800,
    cursor: "pointer",
  },

  secondaryButton: {
    padding: "12px 18px",
    borderRadius: 12,
    border:
      "1px solid rgba(255,255,255,.15)",
    background: "#16263a",
    color: "#fff",
    cursor: "pointer",
  },

  dangerButton: {
    width: "100%",
    marginTop: 15,
    padding: 14,
    border: 0,
    borderRadius: 12,
    background: "#b42332",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },

  backButton: {
    border: 0,
    background: "transparent",
    color: "#8ecbff",
    fontSize: 17,
    cursor: "pointer",
    marginBottom: 20,
  },

  sessionBox: {
    textAlign: "center",
  },

  timer: {
    fontSize: 40,
    fontWeight: 900,
    margin: "20px 0",
  },

  qrWrapper: {
    display: "inline-block",
    background: "#fff",
    padding: 18,
    borderRadius: 18,
    margin: 10,
  },

  warning: {
    color: "#ffd166",
  },

  reader: {
    width: "100%",
    maxWidth: 500,
    margin: "20px auto",
    borderRadius: 15,
    overflow: "hidden",
  },

  statusBox: {
    marginTop: 20,
    padding: 18,
    borderRadius: 14,
    background:
      "rgba(255,255,255,.08)",
    textAlign: "center",
    fontSize: 18,
    fontWeight: 700,
  },

  securityBox: {
    marginTop: 25,
    padding: 20,
    borderRadius: 16,
    background:
      "rgba(0,255,150,.06)",
    border:
      "1px solid rgba(0,255,150,.15)",
  },

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(160px,1fr))",
    gap: 15,
    marginBottom: 25,
  },

  stat: {
    padding: 20,
    borderRadius: 16,
    background:
      "rgba(255,255,255,.07)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  empty: {
    padding: 30,
    textAlign: "center",
    color: "#aebdcd",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 800,
  },

  developerCard: {
    position: "fixed",
    bottom: 15,
    left: 15,
    padding: "10px 14px",
    borderRadius: 12,
    background:
      "rgba(0,0,0,.75)",
    border:
      "1px solid rgba(255,255,255,.12)",
    color: "#dbeafe",
    fontSize: 11,
    lineHeight: 1.6,
    zIndex: 100,
  },
};
