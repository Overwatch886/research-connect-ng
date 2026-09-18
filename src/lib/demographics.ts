import { supabase } from "@/integrations/supabase/client";

export interface StudentDemographics {
  university: string;
  geopoliticalZone: string;
  levelOfStudy: string;
  faculty: string;
  department: string;
  livingArrangement: string;
  monthlyBudgetTier: string;
  updatedAt: string;
}

export const NIGERIAN_UNIVERSITIES = [
  "University of Ibadan (UI)",
  "University of Lagos (UNILAG)",
  "Obafemi Awolowo University (OAU)",
  "University of Nigeria Nsukka (UNN)",
  "Ahmadu Bello University (ABU)",
  "Covenant University",
  "Lagos State University (LASU)",
  "Federal University of Technology Akure (FUTA)",
  "Federal University of Technology Minna (FUTMinna)",
  "University of Benin (UNIBEN)",
  "University of Ilorin (UNILORIN)",
  "University of Port Harcourt (UNIPORT)",
  "University of Abuja (UniAbuja)",
  "Bayero University Kano (BUK)",
  "Babcock University",
  "Bowen University",
  "Ladoke Akintola University of Technology (LAUTECH)",
  "Olabisi Onabanjo University (OOU)",
  "Other / Specialized College",
];

export const GEOPOLITICAL_ZONES = [
  "South-West",
  "South-East",
  "South-South",
  "North-Central",
  "North-West",
  "North-East",
];

export const UNIVERSITY_ZONE_MAP: Record<string, string> = {
  "University of Ibadan (UI)": "South-West",
  "University of Lagos (UNILAG)": "South-West",
  "Obafemi Awolowo University (OAU)": "South-West",
  "Covenant University": "South-West",
  "Lagos State University (LASU)": "South-West",
  "Federal University of Technology Akure (FUTA)": "South-West",
  "Babcock University": "South-West",
  "Bowen University": "South-West",
  "Ladoke Akintola University of Technology (LAUTECH)": "South-West",
  "Olabisi Onabanjo University (OOU)": "South-West",
  "University of Nigeria Nsukka (UNN)": "South-East",
  "University of Benin (UNIBEN)": "South-South",
  "University of Port Harcourt (UNIPORT)": "South-South",
  "University of Ilorin (UNILORIN)": "North-Central",
  "University of Abuja (UniAbuja)": "North-Central",
  "Federal University of Technology Minna (FUTMinna)": "North-Central",
  "Ahmadu Bello University (ABU)": "North-West",
  "Bayero University Kano (BUK)": "North-West",
};

export const LEVELS_OF_STUDY = [
  "100 Level (Freshman)",
  "200 Level",
  "300 Level",
  "400 Level",
  "500 Level (Final Year)",
  "Postgraduate (Masters / PGD / PhD)",
];

export const FACULTIES = [
  "Sciences & Computing",
  "Engineering & Technology",
  "Clinical Sciences & Medicine",
  "Social & Management Sciences",
  "Arts & Humanities",
  "Law",
  "Pharmacy & Pharmacology",
  "Agriculture & Environmental Sciences",
  "Education",
];

export const LIVING_ARRANGEMENTS = [
  "On-campus University Hostel",
  "Off-campus Private Lodge / Rental",
  "Living with Parents / Family at Home",
];

export const MONTHLY_BUDGET_TIERS = [
  "Under ₦20,000 / month",
  "₦20,000 – ₦50,000 / month",
  "₦50,000 – ₦100,000 / month",
  "Over ₦100,000 / month",
];

export const DEFAULT_DEMOGRAPHICS: StudentDemographics = {
  university: "University of Ibadan (UI)",
  geopoliticalZone: "South-West",
  levelOfStudy: "300 Level",
  faculty: "Sciences & Computing",
  department: "Computer Science",
  livingArrangement: "Off-campus Private Lodge / Rental",
  monthlyBudgetTier: "₦20,000 – ₦50,000 / month",
  updatedAt: new Date().toISOString(),
};

export const getStudentDemographics = (): StudentDemographics => {
  if (typeof window === "undefined") return DEFAULT_DEMOGRAPHICS;
  try {
    const raw = localStorage.getItem("research_connect_demographics");
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return DEFAULT_DEMOGRAPHICS;
};

export const saveStudentDemographics = async (
  demographics: StudentDemographics,
  userId?: string
): Promise<void> => {
  if (typeof window !== "undefined") {
    localStorage.setItem("research_connect_demographics", JSON.stringify(demographics));
  }

  if (userId) {
    try {
      await supabase
        .from("profiles")
        .update({
          university: demographics.university,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    } catch (e) {
      console.warn("Demographics sync to Supabase skipped", e);
    }
  }
};

export interface DemographicMatchResult {
  isMatch: boolean;
  score: number;
  matchReason: string;
}

export const calculateDemographicMatch = (
  survey: any,
  demographics: StudentDemographics
): DemographicMatchResult => {
  const targets = survey?.target_universities;

  // Case 1: Survey targets "All Universities", null, or empty -> Open to all
  if (!targets || !Array.isArray(targets) || targets.length === 0 || targets.includes("All Universities")) {
    return {
      isMatch: true,
      score: 100,
      matchReason: "Open Nationwide Student Sample",
    };
  }

  const studentUni = demographics.university.toLowerCase();
  const studentZone = demographics.geopoliticalZone.toLowerCase();

  // Case 2: Survey explicitly targets student's university
  const directMatch = targets.some((t: string) => {
    const targetLower = t.toLowerCase();
    return (
      studentUni.includes(targetLower) ||
      targetLower.includes(studentUni) ||
      (studentUni.includes("ibadan") && targetLower.includes("ibadan")) ||
      (studentUni.includes("lagos") && targetLower.includes("lagos")) ||
      (studentUni.includes("ife") && (targetLower.includes("oau") || targetLower.includes("ife"))) ||
      (studentUni.includes("nsukka") && (targetLower.includes("unn") || targetLower.includes("nsukka"))) ||
      (studentUni.includes("bello") && (targetLower.includes("abu") || targetLower.includes("bello")))
    );
  });

  if (directMatch) {
    const cleanName = demographics.university.split("(")[0].trim();
    return {
      isMatch: true,
      score: 100,
      matchReason: `Direct Match: ${cleanName}`,
    };
  }

  // Case 3: Survey targets universities in the same geopolitical zone
  const regionalMatch = targets.some((t: string) => {
    const mappedZone = UNIVERSITY_ZONE_MAP[t];
    return mappedZone && mappedZone.toLowerCase() === studentZone;
  });

  if (regionalMatch) {
    return {
      isMatch: true,
      score: 85,
      matchReason: `Regional Match: ${demographics.geopoliticalZone} Zone`,
    };
  }

  // Case 4: General match
  return {
    isMatch: false,
    score: 40,
    matchReason: "Open Sample Available",
  };
};
