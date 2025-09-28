/**
 * サービスコンテキスト - React Context API による依存性注入
 */

"use client";

import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { serviceContainer, type ServiceContainer } from "../services/service-container";

const ServiceContext = createContext<ServiceContainer | null>(null);

interface ServiceProviderProps {
  children: ReactNode;
}

export function ServiceProvider({ children }: ServiceProviderProps) {
  useEffect(() => {
    return () => {
      serviceContainer.cleanup();
    };
  }, []);

  return <ServiceContext.Provider value={serviceContainer}>{children}</ServiceContext.Provider>;
}

export function useServices(): ServiceContainer {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error("useServices must be used within a ServiceProvider");
  }
  return context;
}

export function useAnimationController() {
  const services = useServices();
  return services.animationController;
}
