import { authService } from './authService';
import { bookingService } from './bookingService';
import { galleryService } from './galleryService';
import { adminService } from './adminService';
import { storageService } from './storageService';

export const dataService = {
  // Config state checks
  isConfigured: authService.isConfigured.bind(authService),

  // Auth Operations
  signUp: authService.signUp.bind(authService),
  login: authService.login.bind(authService),
  getAdminWhitelist: authService.getAdminWhitelist.bind(authService),
  signInWithGoogle: authService.signInWithGoogle.bind(authService),
  logout: authService.logout.bind(authService),
  getCurrentUser: authService.getCurrentUser.bind(authService),
  forgotPassword: authService.forgotPassword.bind(authService),

  // Reservation & Inquiry Operations
  getRSVPs: bookingService.getRSVPs.bind(bookingService),
  submitRSVP: bookingService.submitRSVP.bind(bookingService),
  getTransports: bookingService.getTransports.bind(bookingService),
  submitTransport: bookingService.submitTransport.bind(bookingService),
  getRooms: bookingService.getRooms.bind(bookingService),
  setRoomBooking: bookingService.setRoomBooking.bind(bookingService),
  deleteRoomBooking: bookingService.deleteRoomBooking.bind(bookingService),
  getInquiries: bookingService.getInquiries.bind(bookingService),
  addInquiry: bookingService.addInquiry.bind(bookingService),
  updateInquiryStatus: bookingService.updateInquiryStatus.bind(bookingService),
  deleteInquiry: bookingService.deleteInquiry.bind(bookingService),

  // Media & Services Catalog CMS
  getServices: galleryService.getServices.bind(galleryService),
  addService: galleryService.addService.bind(galleryService),
  updateService: galleryService.updateService.bind(galleryService),
  deleteService: galleryService.deleteService.bind(galleryService),
  getGallery: galleryService.getGallery.bind(galleryService),
  addGalleryItem: galleryService.addGalleryItem.bind(galleryService),
  updateGalleryItem: galleryService.updateGalleryItem.bind(galleryService),
  deleteGalleryItem: galleryService.deleteGalleryItem.bind(galleryService),

  // Whitelists & Audit Logs
  getFamilies: adminService.getFamilies.bind(adminService),
  addFamily: adminService.addFamily.bind(adminService),
  updateFamily: adminService.updateFamily.bind(adminService),
  deleteFamily: adminService.deleteFamily.bind(adminService),
  getFamilyByCode: adminService.getFamilyByCode.bind(adminService),
  getFamilyBySlug: adminService.getFamilyBySlug.bind(adminService),
  getAccounts: adminService.getAccounts.bind(adminService),
  addAccount: adminService.addAccount.bind(adminService),
  updateUserRoleAndPhone: adminService.updateUserRoleAndPhone.bind(adminService),
  getAuditLogs: adminService.getAuditLogs.bind(adminService),
  createAuditLog: adminService.createAuditLog.bind(adminService),
  getVenueSettings: adminService.getVenueSettings.bind(adminService),
  updateVenueSettings: adminService.updateVenueSettings.bind(adminService),

  // File Storage Operations
  uploadImage: storageService.uploadImage.bind(storageService),
  deleteImage: storageService.deleteImage.bind(storageService)
};
