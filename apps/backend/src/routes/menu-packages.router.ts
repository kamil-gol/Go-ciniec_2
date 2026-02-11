import express from 'express';
import { menuPackagesService } from '../services/menu-packages.service';
import type { Request, Response } from 'express';

const router = express.Router();

/**
 * GET /api/menu-packages
 * Lista wszystkich pakietów menu
 * Query params:
 *   - menuTemplateId: filtruj po szablonie
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const menuTemplateId = req.query.menuTemplateId as string | undefined;
    
    const packages = await menuPackagesService.findAll(menuTemplateId);
    
    res.json({
      success: true,
      data: packages,
      count: packages.length,
    });
  } catch (error) {
    console.error('Failed to fetch packages:', error);
    res.status(500).json({
      success: false,
      message: 'Nie udało się pobrać pakietów',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/menu-packages/:id
 * Szczegóły pakietu z categorySettings
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const pkg = await menuPackagesService.findById(id);
    
    if (!pkg) {
      res.status(404).json({
        success: false,
        message: 'Pakiet nie został znaleziony',
      });
      return;
    }
    
    res.json({
      success: true,
      data: pkg,
    });
  } catch (error) {
    console.error('Failed to fetch package:', error);
    res.status(500).json({
      success: false,
      message: 'Nie udało się pobrać pakietu',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/menu-packages
 * Tworzenie nowego pakietu
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const packageData = req.body;
    
    const newPackage = await menuPackagesService.create(packageData);
    
    res.status(201).json({
      success: true,
      data: newPackage,
      message: 'Pakiet został utworzony',
    });
  } catch (error) {
    console.error('Failed to create package:', error);
    res.status(500).json({
      success: false,
      message: 'Nie udało się utworzyć pakietu',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/menu-packages/:id
 * Aktualizacja pakietu + categorySettings
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedPackage = await menuPackagesService.update(id, updateData);
    
    res.json({
      success: true,
      data: updatedPackage,
      message: 'Pakiet został zaktualizowany',
    });
  } catch (error) {
    console.error('Failed to update package:', error);
    res.status(500).json({
      success: false,
      message: 'Nie udało się zaktualizować pakietu',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/menu-packages/:id
 * Usuwanie pakietu
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await menuPackagesService.delete(id);
    
    res.json({
      success: true,
      message: 'Pakiet został usunięty',
    });
  } catch (error) {
    console.error('Failed to delete package:', error);
    res.status(500).json({
      success: false,
      message: 'Nie udało się usunąć pakietu',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
