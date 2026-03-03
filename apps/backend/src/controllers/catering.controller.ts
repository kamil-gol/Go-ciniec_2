import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import * as cateringService from '../services/catering.service';

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
  const template = await cateringService.createCateringTemplate(req.body);
  res.status(201).json({ success: true, data: template });
});

export const updateTemplate = asyncHandler(async (req: Request, res: Response) => {
  const template = await cateringService.updateCateringTemplate(req.params.id, req.body);
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
  const pkg = await cateringService.createCateringPackage(req.params.id, req.body);
  res.status(201).json({ success: true, data: pkg });
});

export const updatePackage = asyncHandler(async (req: Request, res: Response) => {
  const pkg = await cateringService.updateCateringPackage(req.params.packageId, req.body);
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
  const section = await cateringService.createCateringSection(req.params.packageId, req.body);
  res.status(201).json({ success: true, data: section });
});

export const updateSection = asyncHandler(async (req: Request, res: Response) => {
  const section = await cateringService.updateCateringSection(req.params.sectionId, req.body);
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
  const option = await cateringService.addOptionToSection(req.params.sectionId, req.body);
  res.status(201).json({ success: true, data: option });
});

export const updateOption = asyncHandler(async (req: Request, res: Response) => {
  const option = await cateringService.updateSectionOption(req.params.optionId, req.body);
  res.json({ success: true, data: option });
});

export const removeOption = asyncHandler(async (req: Request, res: Response) => {
  await cateringService.removeOptionFromSection(req.params.optionId);
  res.json({ success: true, message: 'Opcja usunięta' });
});
