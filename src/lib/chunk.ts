export function chunk<T>(array: T[], chunkSize=3) {
  return Array.from({length : Math.ceil(array.length / chunkSize)}).map((_, index) => {
    return array.slice(index * chunkSize, index * chunkSize + chunkSize);
  });
}
