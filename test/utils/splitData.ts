export const split32Bytes = (data: string) => {
  return data.slice(2).match(/.{1,64}/g) as string[];
}
