import { ApiException } from "@/lib/server/api-response";
import {
  readBoolean,
  readNonNegativeNumber,
  readNullableString,
  readObject,
  readString,
} from "@/lib/server/validation";

export function readProductOptionGroups(
  value: unknown,
  options: { optional?: boolean } = {},
) {
  if (value === undefined && options.optional) return undefined;
  if (!Array.isArray(value)) {
    throw new ApiException("Option groups must be a list", 400);
  }
  if (value.length > 10) {
    throw new ApiException("A product can have at most 10 option groups", 400);
  }

  return value.map((groupValue, groupIndex) => {
    const group = readObject(groupValue);
    const optionValues = group.options;
    if (!Array.isArray(optionValues) || optionValues.length === 0) {
      throw new ApiException(
        "Each option group needs at least one choice",
        400,
      );
    }
    if (optionValues.length > 30) {
      throw new ApiException(
        "An option group can have at most 30 choices",
        400,
      );
    }

    const required = readBoolean(group, "required") ?? false;
    const minSelections = Math.round(
      readNonNegativeNumber(group, "minSelections") ?? (required ? 1 : 0),
    );
    const maxSelections = Math.round(
      readNonNegativeNumber(group, "maxSelections") ?? 1,
    );
    if (
      maxSelections < 1 ||
      minSelections > maxSelections ||
      maxSelections > optionValues.length
    ) {
      throw new ApiException("Invalid option selection limits", 400);
    }

    return {
      name: readString(group, "name", { min: 1 })!,
      nameKh: readNullableString(group, "nameKh"),
      required,
      minSelections,
      maxSelections,
      sortOrder: Math.round(
        readNonNegativeNumber(group, "sortOrder") ?? groupIndex,
      ),
      options: {
        create: optionValues.map((optionValue, optionIndex) => {
          const option = readObject(optionValue);
          return {
            name: readString(option, "name", { min: 1 })!,
            nameKh: readNullableString(option, "nameKh"),
            priceDelta: readNonNegativeNumber(option, "priceDelta") ?? 0,
            isAvailable: readBoolean(option, "isAvailable") ?? true,
            sortOrder: Math.round(
              readNonNegativeNumber(option, "sortOrder") ?? optionIndex,
            ),
          };
        }),
      },
    };
  });
}

export const productOptionInclude = {
  optionGroups: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      options: { orderBy: { sortOrder: "asc" as const } },
    },
  },
} as const;
