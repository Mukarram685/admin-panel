"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchAPI } from "@/utils/api";

export interface Company {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
}

interface CompanyFilterContextType {
  selectedCompanyId: string;
  selectedCompany: Company | null;
  setSelectedCompanyId: (id: string) => void;
  companies: Company[];
  loadingCompanies: boolean;
  refreshCompanies: () => Promise<void>;
}

const CompanyFilterContext = createContext<CompanyFilterContextType>({
  selectedCompanyId: "",
  selectedCompany: null,
  setSelectedCompanyId: () => {},
  companies: [],
  loadingCompanies: false,
  refreshCompanies: async () => {},
});

export function CompanyFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string>("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(false);

  const setSelectedCompanyId = (id: string) => {
    setSelectedCompanyIdState(id);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("superadmin_selected_company", id);
    }
  };

  const refreshCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const res = await fetchAPI("/companies/list");
      const list = res.companies || [];
      const approved = list.filter((c: Company) => c.status === "approved" || !c.status);
      setCompanies(approved);
    } catch (err) {
      console.error("Failed to load companies for filter:", err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === "superadmin") {
          refreshCompanies();
          const savedCompany = sessionStorage.getItem("superadmin_selected_company");
          if (savedCompany) {
            setSelectedCompanyIdState(savedCompany);
          }
        }
      } catch (e) {
        console.error("Error parsing user session in CompanyFilterContext:", e);
      }
    }
  }, []);

  const selectedCompany = companies.find((c) => c._id === selectedCompanyId) || null;

  return (
    <CompanyFilterContext.Provider
      value={{
        selectedCompanyId,
        selectedCompany,
        setSelectedCompanyId,
        companies,
        loadingCompanies,
        refreshCompanies,
      }}
    >
      {children}
    </CompanyFilterContext.Provider>
  );
}

export function useCompanyFilter() {
  return useContext(CompanyFilterContext);
}
