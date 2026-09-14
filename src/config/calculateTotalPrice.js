// Calculation of prize total

import { productOptions } from "./productOptions";
import { getLegMaterialOptions } from "./configuratorRules";

export function calculateTotalPrice(selected) {
  let total = 0;

  // Find the selected option and return its price
  function getOptionPrice(options, value) {
    const option = options.find((option) => option.value === value);
    return option?.price ?? 0;
  }

  // Size
  total += getOptionPrice(
    productOptions.size.length.options,
    selected.size.length,
  );

  // Speaker
  total += getOptionPrice(
    productOptions.speaker.included.options,
    selected.speaker.included,
  );

  total += getOptionPrice(
    productOptions.speaker.grille.options,
    selected.speaker.grille,
  );

  // Materials
  total += getOptionPrice(
    productOptions.materials.surface.options,
    selected.materials.surface,
  );

  total += getOptionPrice(
    productOptions.materials.woodVeneer.options,
    selected.materials.woodVeneer,
  );

  // Legs are dynamically generated
  const legOptions = getLegMaterialOptions(selected.materials.woodVeneer);

  total += getOptionPrice(legOptions, selected.materials.legs);

  // Turntable
  total += getOptionPrice(
    productOptions.turntable.baseColor.options,
    selected.turntable.baseColor,
  );

  total += getOptionPrice(
    productOptions.turntable.basePlatter.options,
    selected.turntable.basePlatter,
  );

  return total;
}
