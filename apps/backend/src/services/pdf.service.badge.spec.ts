import { pdfService } from './pdf.service';
import type { MenuCardPDFData } from './pdf.service';

describe('PDF Service - Badge Coverage', () => {
  const mockMenuCardData: MenuCardPDFData = {
    templateName: 'Test Menu',
    templateDescription: 'Test Description',
    variant: 'Premium',
    eventTypeName: 'Wesele',
    eventTypeColor: '#c8a45a',
    packages: [
      {
        name: 'Pakiet Testowy',
        description: 'Opis pakietu',
        shortDescription: null,
        pricePerAdult: 150,
        pricePerChild: 75,
        pricePerToddler: 0,
        badgeText: null,
        includedItems: ['Napoje', 'Obsługa'],
        courses: [
          {
            name: 'Przystawki',
            description: 'Wybrane przystawki',
            icon: null,
            minSelect: 2,
            maxSelect: 3,
            dishes: [
              {
                name: 'Carpaccio',
                description: 'Z wołowiny',
                allergens: ['gluten'],
              },
            ],
          },
        ],
        options: [],
      },
    ],
  };

  it('should render badge when package has badgeText', async () => {
    const dataWithBadge: MenuCardPDFData = {
      ...mockMenuCardData,
      packages: [
        {
          ...mockMenuCardData.packages[0],
          badgeText: 'BESTSELLER',
        },
      ],
    };

    const buffer = await pdfService.generateMenuCardPDF(dataWithBadge);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('should render without badge when badgeText is null', async () => {
    const buffer = await pdfService.generateMenuCardPDF(mockMenuCardData);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });
});
