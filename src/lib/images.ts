import heroShowcaseImg from '../assets/images/hero_doceria_showcase_1794603305201.jpg';
import brigadeiroImg from '../assets/images/doce_brigadeiro_gourmet_1794603305878.jpg';
import beijinhoImg from '../assets/images/doce_beijinho_coco_1794603306305.jpg';
import brownieImg from '../assets/images/doce_brownie_artesanal_1794603306572.jpg';
import boloCenouraImg from '../assets/images/doce_bolo_cenoura_1794603307353.jpg';
import palhaItalianaImg from '../assets/images/doce_palha_italiana_1794603307347.jpg';

export const HERO_IMAGE = heroShowcaseImg;

const PRESET_MAP: Record<string, string> = {
  'preset:hero': heroShowcaseImg,
  'preset:brigadeiro': brigadeiroImg,
  'preset:beijinho': beijinhoImg,
  'preset:brownie': brownieImg,
  'preset:bolo_cenoura': boloCenouraImg,
  'preset:palha_italiana': palhaItalianaImg,
};

export const PRESET_IMAGE_OPTIONS = [
  { value: 'preset:brigadeiro', label: 'Brigadeiro Gourmet' },
  { value: 'preset:beijinho', label: 'Beijinho de Coco' },
  { value: 'preset:brownie', label: 'Brownie Artesanal' },
  { value: 'preset:bolo_cenoura', label: 'Bolo de Cenoura' },
  { value: 'preset:palha_italiana', label: 'Palha Italiana' },
  { value: 'preset:hero', label: 'Caixa Degustação' },
];

export function resolveProductImage(imageUrl: string): string {
  if (!imageUrl) return brigadeiroImg;
  if (PRESET_MAP[imageUrl]) return PRESET_MAP[imageUrl];
  return imageUrl;
}
