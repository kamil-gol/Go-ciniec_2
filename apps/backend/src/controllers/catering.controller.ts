import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import * as cateringService from '../services/catering.service';
import {
  createCateringTemplateSchema,
  updateCateringTemplateSchema,
  createCateringPackageSchema,
  updateCateringPackageSchema,
  createCateringSectionSchema,
  updateCateringSectionSchema,
  createCateringSectionOptionSchema,
  updateCateringSectionOptionSchema,
} from '../validation/catering.validation';

// ═══════════════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════════════

export const getTemplates = asyncHandler(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === 'true';
  const templates = await cateringService.getCateringTemplates(includeInactive);
  res.json({ success: true, data: templates });
});

export const getTemplateById = asyncHandler(async (req: Request, res: Response) => {
  const template = await cateringService.getCateringTemplateById(req.params.id);
  res.json({ success: true, data: template });
});

export const createTemplate = asyncHandler(async (req: Request, res: Response) => {
  const body = createCateringTemplateSchema.parse(req.body);
  const template = await cateringService.createCateringTemplate(body);
  res.status(201).json({ success: true, data: template });
});

export const updateTemplate = asyncHandler(async (req: Request, res: Response) => {
  const body = updateCateringTemplateSchema.parse(req.body);
  const template = await cateringService.updateCateringTemplate(req.params.id, body);
  res.json({ success: true, data: template });
});

export const deleteTemplate = asyncHandler(async (req: Request, res: Response) => {
  await cateringService.deleteCateringTemplate(req.params.id);
  res.json({ success: true, message: 'Szablon cateringu usunięty' });
});

// ═══════════════════════════════════════════════════════════════
// PACKAGES
// ═══════════════════════════════════════════════════════════════

export const getPackageById = asyncHandler(async (req: Request, res: Response) => {
  const pkg = await cateringService.getCateringPackageById(req.params.packageId);
  res.json({ success: true, data: pkg });
});

export const createPackage = asyncHandler(async (req: Request, res: Response) => {
  const body = createCateringPackageSchema.parse(req.body);
  const pkg = await cateringService.createCateringPackage(req.params.id, body);
  res.status(201).json({ success: true, data: pkg });
});

export const updatePackage = asyncHandler(async (req: Request, res: Response) => {
  const body = updateCateringPackageSchema.parse(req.body);
  const pkg = await cateringService.updateCateringPackage(req.params.packageId, body);
  res.json({ success: true, data: pkg });
});

export const deletePackage = asyncHandler(async (req: Request, res: Response) => {
  await cateringService.deleteCateringPackage(req.params.packageId);
  res.json({ success: true, message: 'Pakiet cateringu usunięty' });
});

// ═══════════════════════════════════════════════════════════════
// SECTIONS
// ═══════════════════════════════════════════════════════════════

export const createSection = asyncHandler(async (req: Request, res: Response) => {
  const body = createCateringSectionSchema.parse(req.body);
  const section = await cateringService.createCateringSection(req.params.packageId, body);
  res.status(201).json({ success: true, data: section });
});

export const updateSection = asyncHandler(async (req: Request, res: Response) => {
  const body = updateCateringSectionSchema.parse(req.body);
  const section = await cateringService.updateCateringSection(req.params.sectionId, body);
  res.json({ success: true, data: section });
});

export const deleteSection = asyncHandler(async (req: Request, res: Response) => {
  await cateringService.deleteCateringSection(req.params.sectionId);
  res.json({ success: true, message: 'Sekcja usunięta' });
});

// ═══════════════════════════════════════════════════════════════
// OPTIONS
// ═══════════════════════════════════════════════════════════════

export const addOption = asyncHandler(async (req: Request, res: Response) => {
  const body = createCateringSectionOptionSchema.parse(req.body);
  const option = await cateringService.addOptionToSection(req.params.sectionId, body);
  res.status(201).json({ success: true, data: option });
});

export const updateOption = asyncHandler(async (req: Request, res: Response) => {
  const body = updateCateringSectionOptionSchema.parse(req.body);
  const option = await cateringService.updateSectionOption(req.params.optionId, body);
  res.json({ success: true, data: option });
});

export const removeOption = asyncHandler(async (req: Request, res: Response) => {
  await cateringService.removeOptionFromSection(req.params.optionId);
  res.json({ success: true, message: 'Opcja usunięta' });
});
