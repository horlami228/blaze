import {
  Gender as PrismaGender,
  UserRole as PrismaUserRole,
  VehicleType as PrismaVehicleType,
  RideStatus as PrismaRideStatus,
  VehicleColor as PrismaVehicleColor,
} from '@prisma/client';
import {
  Gender as SharedGenderObj,
  UserRole as SharedUserRoleObj,
  VehicleType as SharedVehicleTypeObj,
  RideStatus as SharedRideStatusObj,
  VehicleColor as SharedVehicleColorObj,
} from '@blaze/shared/src/enum';

// Helper to extract values from the const objects in Shared
type SharedGender = (typeof SharedGenderObj)[keyof typeof SharedGenderObj];
type SharedUserRole =
  (typeof SharedUserRoleObj)[keyof typeof SharedUserRoleObj];
type SharedVehicleType =
  (typeof SharedVehicleTypeObj)[keyof typeof SharedVehicleTypeObj];
type SharedRideStatus =
  (typeof SharedRideStatusObj)[keyof typeof SharedRideStatusObj];
type SharedVehicleColor =
  (typeof SharedVehicleColorObj)[keyof typeof SharedVehicleColorObj];

// --- Gender Sync Check ---
const genderCheck1: PrismaGender = {} as SharedGender; // Shared must be assignable to Prisma
const genderCheck2: SharedGender = {} as PrismaGender; // Prisma must be assignable to Shared

// --- UserRole Sync Check ---
const roleCheck1: PrismaUserRole = {} as SharedUserRole;
const roleCheck2: SharedUserRole = {} as PrismaUserRole;

// --- VehicleType Sync Check ---
const vTypeCheck1: PrismaVehicleType = {} as SharedVehicleType;
const vTypeCheck2: SharedVehicleType = {} as PrismaVehicleType;

// --- RideStatus Sync Check ---
const statusCheck1: PrismaRideStatus = {} as SharedRideStatus;
const statusCheck2: SharedRideStatus = {} as PrismaRideStatus;

// --- VehicleColor Sync Check ---
const colorCheck1: PrismaVehicleColor = {} as SharedVehicleColor;
const colorCheck2: SharedVehicleColor = {} as PrismaVehicleColor;
