
export const swapRemove = (values: any[], index: number): void => {
  [values[index], values[values.length - 1]] = [values[values.length - 1], values[index]];
  values.pop();
};

export const findSortedIndex = <T>(value: T, values: T[], lss: (a: T, b: T) => boolean): number => {
  let low = 0, high = values.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);

    if (lss(values[mid], value)) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
};

export const insertSorted = <T>(value: T, values: T[], lss: (a: T, b: T) => boolean): void => {
  const index = findSortedIndex(value, values, lss);
  values.splice(index, 0, value);
};