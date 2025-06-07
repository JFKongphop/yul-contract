export const hexDecoder = (hex: string) => {
  const biCharArrays = hex.match(/.{1,2}/g)!;
  const zeroCleaner = biCharArrays.filter((byte) => byte != '00');
  const base16Arrays = zeroCleaner.map((byte) => parseInt(byte, 16));

  const bytes = new Uint8Array(base16Arrays);
  return (new TextDecoder("utf-8").decode(bytes)).replace(/\n/g, '');
};
