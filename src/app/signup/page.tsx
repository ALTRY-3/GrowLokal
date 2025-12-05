"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import ImageCarousel from "@/components/ImageCarousel";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import { useRecaptcha } from "@/lib/useRecaptcha";
import { useCsrfToken, getCsrfHeaders } from "@/lib/useCsrfToken";
import { getFriendlyErrorMessage } from "@/lib/authErrors";
import type { PasswordStrength } from "@/lib/passwordPolicy";
import "./signup.css";

// Barangay data for Olongapo (kept as detailed set)
const BARANGAYS = [
  "Asinan",
  "Banicain",
  "Baretto",
  "Barrio Bagy",
  "East Bajac-Bajac",
  "East Tapinac",
  "Gordon Heights",
  "Kalaklan",
  "Kalalake",
  "Mabayuan",
  "Morong",
  "New Cabalan",
  "New Ilalim",
  "Pag-asa",
  "Sabang",
  "Subic",
  "West Bajac-Bajac",
  "West Tapinac",
];

// Expanded PH location dataset (balanced for coverage without huge payload)
const LOCATION_DATA: Record<
  string,
  {
    provinces: Record<string, { cities: Record<string, string[]> }>;
  }
> = {
  "National Capital Region (NCR)": {
    provinces: {
      "Metro Manila": {
        cities: {
          "Quezon City": ["Batasan Hills", "Commonwealth", "Bagumbayan"],
          Manila: ["Ermita", "Malate", "Sampaloc"],
          Makati: ["Bel-Air", "Poblacion", "San Lorenzo"],
          Pasig: ["Kapitolyo", "Ugong", "Manggahan"],
          Taguig: ["Fort Bonifacio", "Bagumbayan", "Pinagsama"],
          Mandaluyong: ["Plainview", "Mauway", "Barangka"],
          "San Juan": ["Greenhills", "Kabayanan", "Batis"],
          Pasay: ["Baclaran", "San Rafael", "Sto. Niño"],
          Parañaque: ["BF Homes", "San Dionisio", "Don Bosco"],
          Muntinlupa: ["Alabang", "Bayanan", "Tunasan"],
          "Las Piñas": ["Pilar", "Pamplona", "Talon"],
          Caloocan: ["Bagong Silang", "Grace Park", "Maypajo"],
          Malabon: ["Concepcion", "Muzon", "Tinajeros"],
          Navotas: ["San Roque", "North Bay", "Daanghari"],
          Valenzuela: ["Karuhatan", "Malinta", "Gen. T. de Leon"],
          Marikina: ["Sto. Niño", "Concepcion Uno", "Industrial Valley"],
          Pateros: ["Aguho", "Magtanggol", "Sta. Ana"],
        },
      },
    },
  },
  "Ilocos Region (Region I)": {
    provinces: {
      "Ilocos Norte": { cities: { Laoag: ["Barangay 1", "Barangay 2"] } },
      "Ilocos Sur": { cities: { Vigan: ["Barangay I", "Barangay II"] } },
      "La Union": { cities: { "San Fernando": ["Poro", "Tanqui", "Dalumpinas"], Bauang: ["Poblacion", "Central East"] } },
      Pangasinan: { cities: { Lingayen: ["Poblacion", "Baay"], Dagupan: ["Poblacion Oeste", "Pogo"] } },
    },
  },
  "Cagayan Valley (Region II)": {
    provinces: {
      Batanes: { cities: { Basco: ["Kayvaluganan", "Kaychanarianan"] } },
      Cagayan: { cities: { Tuguegarao: ["Caritan Centro", "Pengue-Ruyu"] } },
      Isabela: { cities: { Ilagan: ["Alibagu", "Bagumbayan"], Cauayan: ["District I", "District II"] } },
      "Nueva Vizcaya": { cities: { Bayombong: ["Don Domingo Maddela", "Salvacion"] } },
      Quirino: { cities: { Cabarroguis: ["Gumilab", "Poblacion"] } },
    },
  },
  "Central Luzon (Region III)": {
    provinces: {
      Aurora: { cities: { Baler: ["Poblacion", "Obligacion"] } },
      Bataan: { cities: { Balanga: ["Poblacion", "Cupang"], Dinalupihan: ["Poblacion", "San Ramon"] } },
      Bulacan: { cities: { Malolos: ["Longos", "Tikay", "Bagong Bayan"], Meycauayan: ["Bahay Pare", "Pandayan", "Saluysoy"], Baliuag: ["Bagong Nayon", "Poblacion", "Tiaong"] } },
      "Nueva Ecija": { cities: { Palayan: ["Abar", "Ganaderia"], Cabanatuan: ["Barangay I", "Barangay II"], Gapan: ["Pambuan", "San Vicente"] } },
      Pampanga: { cities: { "San Fernando": ["Del Pilar", "Sindalan", "Sto. Niño"], "Angeles City": ["Balibago", "Cutcut", "Pulungbulu"], Mabalacat: ["Dau", "Mawaque", "Dolores"] } },
      Tarlac: { cities: { "Tarlac City": ["San Roque", "San Sebastian"], Concepcion: ["San Nicolas", "Sta. Rita"] } },
      Zambales: {
        cities: {
          Olongapo: BARANGAYS,
          Subic: ["Aningway-Sacatihan", "Asinan Poblacion", "Calapacuan", "Matain"],
          Castillejos: ["San Agustin", "San Pablo", "San Jose"],
          Iba: ["Dirita", "Sto. Rosario"]
        },
      },
    },
  },
  "CALABARZON (Region IV-A)": {
    provinces: {
      Cavite: { cities: { "Trece Martires": ["Aguado", "De Ocampo"], Imus: ["Medicion", "Pag-asa", "Anabu"], Bacoor: ["Molino", "Talaba", "Niog"] } },
      Laguna: { cities: { "Santa Cruz": ["Bagumbayan", "Gatid"], Calamba: ["Halang", "Real", "Pansol"], "Biñan": ["Sto. Tomas", "Canlalay", "San Vicente"] } },
      Batangas: { cities: { "Batangas City": ["Alangilan", "Kumintang Ibaba", "Pallocan"], Lipa: ["Balintawak", "Sabang", "Santo Toribio"], Tanauan: ["Darasa", "Sala", "Sulpoc"] } },
      Rizal: { cities: { Antipolo: ["San Roque", "Mambugan", "Bagong Nayon"], Cainta: ["San Andres", "Sto. Domingo"], Taytay: ["Dolores", "San Juan"] } },
      Quezon: { cities: { Lucena: ["Gulang-Gulang", "Ibabang Iyam"], Tayabas: ["Abo-Abo", "Alitao"] } },
    },
  },
  "MIMAROPA (Region IV-B)": {
    provinces: {
      "Occidental Mindoro": { cities: { Mamburao: ["Barangay 1", "Barangay 2"] } },
      "Oriental Mindoro": { cities: { Calapan: ["Guinobatan", "Comunal"] } },
      Marinduque: { cities: { Boac: ["Poblacion", "Isok"], Gasan: ["Bachao Ibaba", "Tapuyan"] } },
      Romblon: { cities: { Romblon: ["Agpanabat", "Cajimos"] } },
      Palawan: { cities: { "Puerto Princesa": ["San Pedro", "San Manuel"], Coron: ["Barangay I", "Barangay II"] } },
    },
  },
  "Bicol Region (Region V)": {
    provinces: {
      Albay: { cities: { Legazpi: ["Albay District", "Bgy 1"], Ligao: ["Binatagan", "Batang"] } },
      "Camarines Norte": { cities: { Daet: ["Gahonon", "Lag-on"] } },
      "Camarines Sur": { cities: { Pili: ["San Juan", "San Jose"], Naga: ["Triangulo", "Peñafrancia"] } },
      Catanduanes: { cities: { Virac: ["San Isidro", "San Jose"] } },
      Masbate: { cities: { "Masbate City": ["Pating", "Espinosa"] } },
      Sorsogon: { cities: { "Sorsogon City": ["Abuyog", "Bacon District"] } },
    },
  },
  "Western Visayas (Region VI)": {
    provinces: {
      Aklan: { cities: { Kalibo: ["Poblacion", "Andagao"] } },
      Antique: { cities: { "San Jose": ["Barangay 1", "Barangay 2"] } },
      Capiz: { cities: { "Roxas City": ["Baybay", "Poblacion"] } },
      Guimaras: { cities: { Jordan: ["Poblacion", "San Miguel"] } },
      Iloilo: { cities: { "Iloilo City": ["Jaro", "La Paz", "Mandurriao"] } },
      "Negros Occidental": { cities: { "Bacolod City": ["Mandalagan", "Singcang"], Bago: ["Balingasag", "Abuanan"] } },
    },
  },
  "Central Visayas (Region VII)": {
    provinces: {
      Bohol: { cities: { Tagbilaran: ["Cogon", "Dao"] } },
      Cebu: { cities: { "Cebu City": ["Lahug", "Mabolo", "Guadalupe"], Mandaue: ["Banilad", "Basak"] } },
      "Negros Oriental": { cities: { Dumaguete: ["Bagacay", "Bantayan"] } },
      Siquijor: { cities: { Siquijor: ["Barangay I", "Barangay II"] } },
    },
  },
  "Eastern Visayas (Region VIII)": {
    provinces: {
      Biliran: { cities: { Naval: ["Sto. Niño", "Caraycaray"] } },
      "Eastern Samar": { cities: { Borongan: ["Can-aga", "Lalawigan"] } },
      Leyte: { cities: { Tacloban: ["Abucay", "Apitong"] } },
      "Northern Samar": { cities: { Catarman: ["Airport Village", "Bangkerohan"] } },
      Samar: { cities: { Catbalogan: ["Mercedes", "Maulong"] } },
      "Southern Leyte": { cities: { Maasin: ["Asuncion", "Ibarra"] } },
    },
  },
  "Zamboanga Peninsula (Region IX)": {
    provinces: {
      "Zamboanga del Norte": { cities: { Dipolog: ["Sta. Filomena", "Minaog"] } },
      "Zamboanga del Sur": { cities: { Pagadian: ["Balangasan", "Santiago"] } },
      "Zamboanga Sibugay": { cities: { Ipil: ["Pangi", "Sanito"] } },
    },
  },
  "Northern Mindanao (Region X)": {
    provinces: {
      Bukidnon: { cities: { Malaybalay: ["Aglayan", "Casisang"] } },
      Camiguin: { cities: { Mambajao: ["Poblacion", "Agoho"] } },
      "Lanao del Norte": { cities: { Tubod: ["Poblacion", "Baroy"] } },
      "Misamis Occidental": { cities: { Oroquieta: ["Poblacion I", "Talic"] } },
      "Misamis Oriental": { cities: { "Cagayan de Oro": ["Bugo", "Carmen", "Macasandig"] } },
    },
  },
  "Davao Region (Region XI)": {
    provinces: {
      "Davao de Oro": { cities: { Nabunturan: ["Poblacion", "Santa Maria"] } },
      "Davao del Norte": { cities: { Tagum: ["Apokon", "Visayan Village"] } },
      "Davao del Sur": { cities: { Digos: ["Aplaya", "Cogon"] } },
      "Davao Occidental": { cities: { Malita: ["Poblacion", "Fishing Village"] } },
      "Davao Oriental": { cities: { Mati: ["Central", "Dahican"] } },
    },
  },
  "SOCCSKSARGEN (Region XII)": {
    provinces: {
      Cotabato: { cities: { Kidapawan: ["Sudapin", "Poblacion"] } },
      Sarangani: { cities: { Alabel: ["Alegria", "Bagacay"] } },
      "South Cotabato": { cities: { Koronadal: ["Zone I", "Zone III"] } },
      "Sultan Kudarat": { cities: { Isulan: ["Kalawag I", "Kalawag II"] } },
    },
  },
  "Caraga (Region XIII)": {
    provinces: {
      "Agusan del Norte": { cities: { Cabadbaran: ["Poblacion 1", "Poblacion 2"] } },
      "Agusan del Sur": { cities: { Prosperidad: ["Poblacion", "San Pedro"] } },
      "Dinagat Islands": { cities: { "San Jose": ["Justiniana", "Don Ruben"] } },
      "Surigao del Norte": { cities: { "Surigao City": ["Taft", "Washington"] } },
      "Surigao del Sur": { cities: { Tandag: ["San Agustin", "Awasian"] } },
    },
  },
  "Bangsamoro (BARMM)": {
    provinces: {
      Basilan: { cities: { Lamitan: ["Malakas", "Malinis"] } },
      "Lanao del Sur": { cities: { Marawi: ["Bangon", "Daguduban"] } },
      "Maguindanao del Norte": { cities: { "Datu Odin Sinsuat": ["Tamontaka", "Dalican"] } },
      "Maguindanao del Sur": { cities: { Buluan: ["Poblacion", "Popoyon"] } },
      Sulu: { cities: { Jolo: ["Alat", "Busbus"] } },
      "Tawi-Tawi": { cities: { Bongao: ["Luuk Pandan", "Poblacion"] } },
    },
  },
  "Cordillera (CAR)": {
    provinces: {
      Abra: { cities: { Bangued: ["Zone 1", "Zone 2"] } },
      Apayao: { cities: { Kabugao: ["Poblacion", "Nagtipunan"] } },
      Benguet: { cities: { "La Trinidad": ["Alapang", "Poblacion"], Baguio: ["Loakan", "Irisan", "Aurora Hill"] } },
      Ifugao: { cities: { Lagawe: ["Poblacion", "Burnay"] } },
      Kalinga: { cities: { Tabuk: ["Bulanao", "Dagupan"] } },
      "Mountain Province": { cities: { Bontoc: ["Poblacion", "Caluttit"] } },
    },
  },
};

const REGION_OPTIONS = Object.keys(LOCATION_DATA);

const getProvinceOptions = (region: string) => {
  if (!region || !LOCATION_DATA[region]) return [] as string[];
  return Object.keys(LOCATION_DATA[region].provinces);
};

const getCityOptions = (region: string, province: string) => {
  if (!region || !province) return [] as string[];
  const provinceData = LOCATION_DATA[region]?.provinces?.[province];
  if (!provinceData) return [] as string[];
  return Object.keys(provinceData.cities || {});
};

const getBarangayOptions = (region: string, province: string, city: string) => {
  if (!region || !province || !city) return [] as string[];
  const cityBarangays = LOCATION_DATA[region]?.provinces?.[province]?.cities?.[city];
  return cityBarangays || [];
};

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    // Step 2
    dateOfBirth: "",
    gender: "",
    // Step 3
    street: "",
    barangay: "",
    city: "",
    province: "",
    region: "",
    postalCode: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stepErrors, setStepErrors] = useState<{ [key: string]: string }>({});
  const [devVerificationLink, setDevVerificationLink] = useState<string | null>(
    null
  );
  const [passwordStrength, setPasswordStrength] =
    useState<PasswordStrength | null>(null);
  const [isPasswordBreached, setIsPasswordBreached] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showEmailSentModal, setShowEmailSentModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const { getToken, error: recaptchaError } = useRecaptcha();
  const { csrfToken, loading: csrfLoading } = useCsrfToken();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Redirect authenticated users to home
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/home");
    }
  }, [status, router]);

  // Check for OAuth errors in URL
  useEffect(() => {
    const urlError = searchParams?.get("error");
    if (urlError) {
      setError(getFriendlyErrorMessage(urlError));
    }
  }, [searchParams]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <i
            className="fas fa-spinner fa-spin"
            style={{ fontSize: "48px", color: "#4CAF50" }}
          ></i>
          <p style={{ marginTop: "20px" }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render form if user is authenticated (will redirect)
  if (status === "authenticated") {
    return null;
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field error when user starts typing
    if (stepErrors[name]) {
      setStepErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
    // Clear main error
    if (error) setError("");
  };

  const validateStep = (step: number): boolean => {
    const errors: { [key: string]: string } = {};

    if (step === 1) {
      if (!formData.fullName.trim()) errors.fullName = "Full name is required";
      if (!formData.email.trim()) errors.email = "Email is required";
      if (!formData.phoneNumber.trim())
        errors.phoneNumber = "Phone number is required";
      if (!/^\d{10,11}$/.test(formData.phoneNumber))
        errors.phoneNumber = "Phone must be 10-11 digits";
      if (!formData.password) errors.password = "Password is required";
      if (formData.password !== formData.confirmPassword)
        errors.confirmPassword = "Passwords do not match";
      if (!passwordStrength || passwordStrength.score < 2)
        errors.password = "Password is too weak";
      if (isPasswordBreached)
        errors.password = "Password was found in a data breach";
      if (!agreeToTerms)
        errors.terms = "You must agree to the Terms of Service";
    } else if (step === 2) {
      if (!formData.dateOfBirth)
        errors.dateOfBirth = "Date of birth is required";
      if (!formData.gender) errors.gender = "Gender is required";
    } else if (step === 3) {
      if (!formData.street.trim()) errors.street = "Street address is required";
      if (!formData.region) errors.region = "Region is required";
      if (!formData.province) errors.province = "Province is required";
      if (!formData.city) errors.city = "City is required";
      if (!formData.barangay) errors.barangay = "Barangay is required";
      if (!formData.postalCode.trim())
        errors.postalCode = "Postal code is required";
      if (!/^\d{4}$/.test(formData.postalCode))
        errors.postalCode = "Postal code must be 4 digits";
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      setError("");
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
    setError("");
    setStepErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setIsLoading(true);

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await getToken("signup");

      if (!recaptchaToken && process.env.NODE_ENV !== "development") {
        throw new Error("Security verification failed. Please try again.");
      }

      const response = await fetch(
        "/api/auth/register",
        getCsrfHeaders(csrfToken, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.fullName,
            email: formData.email,
            phone: formData.phoneNumber,
            password: formData.password,
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            street: formData.street,
            barangay: formData.barangay,
            city: formData.city,
            province: formData.province,
            region: formData.region,
            postalCode: formData.postalCode,
            recaptchaToken,
          }),
        })
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.developmentLink) {
        setDevVerificationLink(data.developmentLink);
        console.log("Development verification link:", data.developmentLink);
      }

      // Show email verification modal
      setRegisteredEmail(formData.email);
      setShowEmailSentModal(true);
    } catch (error: any) {
      setError(getFriendlyErrorMessage(error.message || error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (provider: "google" | "facebook") => {
    if (socialLoading || isLoading) return; // Prevent double submit

    setSocialLoading(provider);
    setError(""); // Clear previous errors
    try {
      const result = await signIn(provider, {
        callbackUrl: "/home",
        redirect: false,
      });

      if (result?.error) {
        setError(getFriendlyErrorMessage(result.error));
        setSocialLoading(null);
      } else if (result?.ok) {
        window.location.href = "/home";
      }
    } catch (error: any) {
      setError(getFriendlyErrorMessage(error?.message || error));
      setSocialLoading(null);
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail || isResendingEmail) return;
    
    setIsResendingEmail(true);
    setResendMessage("");
    
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: registeredEmail }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResendMessage("Verification email sent! Please check your inbox.");
      } else {
        setResendMessage(data.message || "Failed to resend email. Please try again.");
      }
    } catch (error) {
      setResendMessage("Network error. Please try again.");
    } finally {
      setIsResendingEmail(false);
    }
  };

  return (
    <div className="app-container">
      {/* Left Panel */}
      <div className="left-panel">
        <div className="pattern-overlay">
          <Image
            src="/left-panel.svg"
            alt="Traditional Pattern"
            className="left-pattern"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            unoptimized
          />
        </div>
        <div className="left-content">
          <div className="logo-section">
            <div className="logo-icon">
              <Image
                src="/logo.svg"
                alt="GrowLokal Logo"
                className="logo-image"
                width={40}
                height={40}
                priority
              />
            </div>
            <span className="logo-text">GROWLOKAL</span>
          </div>

          <div className="hero-section">
            <h1 className="hero-title">
              Be part of <div>Olongapo&apos;s story.</div> Sign up today.
            </h1>
            <p className="hero-subtitle">
              Discover authentic crafts, connect with artisans, and support
              local communities.
            </p>
          </div>

          <ImageCarousel autoSlide={true} slideInterval={2000} />
        </div>
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        <div className="signup-container">
          <div className="signup-header">
            <h2>Get Started</h2>
            <p>
              Already have an account?{" "}
              <Link href="/login" className="login-link">
                Login
              </Link>
            </p>
          </div>

          <form
            className="signup-form"
            onSubmit={
              currentStep === 3
                ? handleSubmit
                : (e) => {
                    e.preventDefault();
                    handleNextStep();
                  }
            }
          >
            {/* Progress Indicator */}
            <div className="progress-indicator">
              <div className="progress-steps">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`progress-step ${
                      currentStep >= step ? "active" : ""
                    } ${currentStep === step ? "current" : ""}`}
                  >
                    <div className="step-circle">{step}</div>
                    <span className="step-label">
                      {step === 1
                        ? "Account"
                        : step === 2
                        ? "Personal"
                        : "Address"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                ></div>
              </div>
            </div>

            {(error || recaptchaError) && (
              <div className="error-message">
                <i className="fas fa-exclamation-triangle"></i>
                {error || recaptchaError}
              </div>
            )}

            {success && (
              <div className="success-message">
                <i className="fas fa-check-circle"></i>
                {success}
              </div>
            )}

            {/* STEP 1: ACCOUNT INFO */}
            {currentStep === 1 && (
              <div className="form-step active">
                <div className="step-title">
                  <h3>Create Your Account</h3>
                  <p>Let's get started with your basic information</p>
                </div>

                <div className="form-group">
                  <div className="input-group">
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Full Name"
                      className={`form-input ${
                        stepErrors.fullName ? "error" : ""
                      }`}
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                    <i className="fas fa-user input-icon"></i>
                  </div>
                  {stepErrors.fullName && (
                    <span className="field-error">{stepErrors.fullName}</span>
                  )}
                </div>

                <div className="form-group">
                  <div className="input-group">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      className={`form-input ${
                        stepErrors.email ? "error" : ""
                      }`}
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                    <i className="fas fa-envelope input-icon"></i>
                  </div>
                  {stepErrors.email && (
                    <span className="field-error">{stepErrors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <div className="input-group">
                    <input
                      type="text"
                      name="phoneNumber"
                      placeholder="Phone Number (10-11 digits)"
                      className={`form-input ${
                        stepErrors.phoneNumber ? "error" : ""
                      }`}
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                    />
                    <i className="fas fa-phone input-icon"></i>
                  </div>
                  {stepErrors.phoneNumber && (
                    <span className="field-error">
                      {stepErrors.phoneNumber}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      className={`form-input ${
                        stepErrors.password ? "error" : ""
                      }`}
                      value={formData.password}
                      onChange={handleInputChange}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      required
                    />
                    <i
                      className={`fas ${
                        showPassword ? "fa-eye-slash" : "fa-eye"
                      } input-icon password-toggle`}
                      onClick={() => setShowPassword(!showPassword)}
                    ></i>
                  </div>
                  {stepErrors.password && (
                    <span className="field-error">{stepErrors.password}</span>
                  )}
                </div>

                {formData.password && isPasswordFocused && (
                  <PasswordStrengthMeter
                    password={formData.password}
                    checkBreaches={true}
                    onChange={(strength, breached) => {
                      setPasswordStrength(strength);
                      setIsPasswordBreached(breached || false);
                    }}
                  />
                )}

                <div className="form-group">
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      className={`form-input ${
                        stepErrors.confirmPassword ? "error" : ""
                      }`}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                    <i
                      className={`fas ${
                        showConfirmPassword ? "fa-eye-slash" : "fa-eye"
                      } input-icon password-toggle`}
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    ></i>
                  </div>
                  {stepErrors.confirmPassword && (
                    <span className="field-error">
                      {stepErrors.confirmPassword}
                    </span>
                  )}
                </div>

                <div className="terms-section">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                    />
                    <span className="checkmark"></span>I agree to the{" "}
                    <span
                      className="terms-link"
                      onClick={() => setShowTermsModal(true)}
                    >
                      Terms of Service and Privacy Policy
                    </span>
                  </label>
                  {stepErrors.terms && (
                    <span className="field-error">{stepErrors.terms}</span>
                  )}
                </div>

                <button type="submit" className="signup-button">
                  Continue
                </button>

                <div className="divider">
                  <span>OR SIGN UP WITH</span>
                </div>

                <div className="social-signup">
                  <button
                    className="social-button facebook"
                    onClick={() => handleSocialSignup("facebook")}
                    type="button"
                    disabled={isLoading || socialLoading !== null}
                    style={{
                      opacity:
                        socialLoading === "facebook" ||
                        (socialLoading && socialLoading !== "facebook")
                          ? 0.6
                          : 1,
                      cursor:
                        isLoading || socialLoading !== null
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {socialLoading === "facebook" ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <Image
                        src="/facebook.svg"
                        className="social-icon"
                        alt="Facebook"
                        width={20}
                        height={20}
                      />
                    )}
                  </button>
                  <button
                    className="social-button google"
                    onClick={() => handleSocialSignup("google")}
                    type="button"
                    disabled={isLoading || socialLoading !== null}
                    style={{
                      opacity:
                        socialLoading === "google" ||
                        (socialLoading && socialLoading !== "google")
                          ? 0.6
                          : 1,
                      cursor:
                        isLoading || socialLoading !== null
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {socialLoading === "google" ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <Image
                        src="/google.svg"
                        className="social-icon"
                        alt="Google"
                        width={20}
                        height={20}
                      />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: PERSONAL DETAILS */}
            {currentStep === 2 && (
              <div className="form-step active">
                <div className="step-title">
                  <h3>Personal Information</h3>
                  <p>Help us know you better</p>
                </div>

                <div className="form-group">
                  <label>Birthday</label>
                  <div className="input-group">
                    <input
                      type="date"
                      name="dateOfBirth"
                      className={`form-input ${
                        stepErrors.dateOfBirth ? "error" : ""
                      }`}
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                    />
                    <i className="fas fa-calendar input-icon"></i>
                  </div>
                  {stepErrors.dateOfBirth && (
                    <span className="field-error">
                      {stepErrors.dateOfBirth}
                    </span>
                  )}
                </div>

                <div className="form-group gender-group">
                  <div className="radio-group">
                    {["Male", "Female", "Prefer not to say"].map((option) => (
                      <label key={option} className="radio-label">
                        <span>{option}</span>
                        <input
                          type="radio"
                          name="gender"
                          value={option}
                          checked={formData.gender === option}
                          onChange={handleInputChange}
                        />
                        <span className="radio-custom"></span>
                      </label>
                    ))}
                  </div>
                  {stepErrors.gender && (
                    <span className="field-error">{stepErrors.gender}</span>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handlePreviousStep}
                  >
                    Back
                  </button>
                  <button type="submit" className="signup-button">
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: ADDRESS INFORMATION */}
            {currentStep === 3 && (
              <div className="form-step active">
                <div className="step-title">
                  <h3>Address Information</h3>
                  <p>Where are you located?</p>
                </div>

                <div className="form-group">
                  <div className="input-group">
                    <input
                      type="text"
                      name="street"
                      placeholder="Street Address"
                      className={`form-input ${
                        stepErrors.street ? "error" : ""
                      }`}
                      value={formData.street}
                      onChange={handleInputChange}
                      required
                    />
                    <i className="fas fa-map-pin input-icon"></i>
                  </div>
                  {stepErrors.street && (
                    <span className="field-error">{stepErrors.street}</span>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <div className="input-group">
                      <select
                        name="region"
                        className={`form-input ${
                          stepErrors.region ? "error" : ""
                        }`}
                        value={formData.region}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            region: e.target.value,
                            province: "",
                            city: "",
                            barangay: "",
                          }));
                          if (stepErrors.region) {
                            setStepErrors((prev) => {
                              const updated = { ...prev };
                              delete updated.region;
                              return updated;
                            });
                          }
                          if (error) setError("");
                        }}
                      >
                        <option value="">Select Region</option>
                        {REGION_OPTIONS.map((region) => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </select>
                      <i className="fas fa-chevron-down input-icon"></i>
                    </div>
                    {stepErrors.region && (
                      <span className="field-error">{stepErrors.region}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <div className="input-group">
                      <select
                        name="province"
                        className={`form-input ${
                          stepErrors.province ? "error" : ""
                        } ${!formData.region ? "disabled-select" : ""}`}
                        value={formData.province}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            province: e.target.value,
                            city: "",
                            barangay: "",
                          }));
                          if (stepErrors.province) {
                            setStepErrors((prev) => {
                              const updated = { ...prev };
                              delete updated.province;
                              return updated;
                            });
                          }
                          if (error) setError("");
                        }}
                        disabled={!formData.region}
                      >
                        <option value="">Select Province</option>
                        {getProvinceOptions(formData.region).map((prov) => (
                          <option key={prov} value={prov}>
                            {prov}
                          </option>
                        ))}
                      </select>
                      <i className="fas fa-chevron-down input-icon"></i>
                    </div>
                    {stepErrors.province && (
                      <span className="field-error">{stepErrors.province}</span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <div className="input-group">
                      <select
                        name="city"
                        className={`form-input ${
                          stepErrors.city ? "error" : ""
                        } ${!formData.province ? "disabled-select" : ""}`}
                        value={formData.city}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            city: e.target.value,
                            barangay: "",
                          }));
                          if (stepErrors.city) {
                            setStepErrors((prev) => {
                              const updated = { ...prev };
                              delete updated.city;
                              return updated;
                            });
                          }
                          if (error) setError("");
                        }}
                        disabled={!formData.province}
                      >
                        <option value="">Select City</option>
                        {getCityOptions(formData.region, formData.province).map(
                          (city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          )
                        )}
                      </select>
                      <i className="fas fa-chevron-down input-icon"></i>
                    </div>
                    {stepErrors.city && (
                      <span className="field-error">{stepErrors.city}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <div className="input-group">
                      <select
                        name="barangay"
                        className={`form-input ${
                          stepErrors.barangay ? "error" : ""
                        } ${!formData.city ? "disabled-select" : ""}`}
                        value={formData.barangay}
                        onChange={handleInputChange}
                        disabled={!formData.city}
                        required
                      >
                        <option value="">Select Barangay</option>
                        {getBarangayOptions(
                          formData.region,
                          formData.province,
                          formData.city
                        ).map((b: string) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                      <i className="fas fa-chevron-down input-icon"></i>
                    </div>
                    {stepErrors.barangay && (
                      <span className="field-error">{stepErrors.barangay}</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <div className="input-group">
                    <input
                      type="text"
                      name="postalCode"
                      placeholder="Postal Code (4 digits)"
                      className={`form-input ${
                        stepErrors.postalCode ? "error" : ""
                      }`}
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      required
                    />
                    <i className="fas fa-location-dot input-icon"></i>
                  </div>
                  {stepErrors.postalCode && (
                    <span className="field-error">{stepErrors.postalCode}</span>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handlePreviousStep}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="signup-button"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        CREATING ACCOUNT...
                      </>
                    ) : (
                      "CREATE ACCOUNT"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-section">
                <i className="fa-solid fa-clipboard-list modal-icon"></i>
                <div className="modal-title-text">
                  <h2>Terms of Service</h2>
                  <p className="modal-date">Last updated September 8, 2026</p>
                </div>
              </div>
            </div>

            <div className="modal-body">
              <p>
                Welcome to GrowLokal, a digital marketplace created to connect
                Olongapo’s artisans, entrepreneurs, and consumers. By accessing
                or using our platform, you agree to these Terms of Service.
                Please read them carefully before proceeding. <br />
                <br />
                GrowLokal exists to provide a community-driven space where users
                can explore local crafts, discover cultural products, and
                support local entrepreneurs. By registering, you confirm that
                you are <b>at least eighteen (18) years old</b> or that you have
                the consent of a parent or guardian to use the platform. You
                also agree to provide accurate and truthful information when
                creating your account. <br />
                <br />
                As a member of GrowLokal, you are expected to use the platform
                responsibly and respectfully. You must not engage in harmful
                behavior, post misleading or inappropriate content, or misuse
                the services provided. Any content you upload, such as product
                descriptions or images, remains your property; however, by
                posting, you grant GrowLokal permission to display this content
                on the platform.{" "}
                <b>
                  Please ensure that all content you share belongs to you or
                  that you have the right to share it.
                </b>
                <br />
                <br />
                We are committed to fostering a respectful and inclusive
                community. Accounts or content that promote hate speech, scams,
                violence, or cultural disrespect may be removed at our
                discretion. GrowLokal is a student-developed project intended
                for educational purposes. As such, we cannot guarantee
                uninterrupted services and we are not liable for disputes or
                issues that may arise between users in connection with products
                or transactions. Users are solely responsible for verifying the
                authenticity of sellers, buyers, and products.
                <br />
                <br />
                Your privacy is important to us. Information you provide during
                signup, such as your name, email address, or other account
                details, will only be used to grant you access to the platform
                and improve your experience. We will never sell or misuse your
                personal data. These Terms of Service may be updated from time
                to time, and continued use of the platform means you accept any
                revisions made. Should you have any questions, concerns, or
                suggestions, you may reach us at{" "}
                <b>growlokal.team@gmail.com. </b>
                By proceeding with signup, you acknowledge that you have read,
                understood, and agreed to these Terms of Service.
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="decline-btn"
                onClick={() => {
                  setAgreeToTerms(false);
                  setShowTermsModal(false);
                }}
              >
                Decline
              </button>
              <button
                className="accept-btn"
                onClick={() => {
                  setAgreeToTerms(true);
                  setShowTermsModal(false);
                }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Verification Sent Modal */}
      {showEmailSentModal && (
        <div className="modal-overlay">
          <div className="modal-content email-sent-modal">
            <div className="email-sent-icon">
              <i className="fas fa-envelope-open-text"></i>
            </div>
            <h2>Verify Your Email</h2>
            <p className="email-sent-message">
              We've sent a verification link to:
            </p>
            <p className="email-address-display">{registeredEmail}</p>
            <p className="email-sent-instructions">
              Please check your inbox and click the verification link to activate your account. 
              If you don't see the email, check your spam folder.
            </p>
            
            {resendMessage && (
              <div className={`resend-message ${resendMessage.includes("sent") ? "success" : "error"}`}>
                <i className={`fas ${resendMessage.includes("sent") ? "fa-check-circle" : "fa-exclamation-circle"}`}></i>
                {resendMessage}
              </div>
            )}
            
            <div className="email-sent-actions">
              <button
                className="resend-btn"
                onClick={handleResendVerification}
                disabled={isResendingEmail}
              >
                {isResendingEmail ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-redo"></i>
                    Resend Email
                  </>
                )}
              </button>
              <button
                className="go-to-login-btn"
                onClick={() => router.push("/login")}
              >
                Go to Login
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
