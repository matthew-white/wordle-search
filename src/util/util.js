export const last = (value) => value[value.length - 1];

export const pluralize = (...args) => {
  if (typeof args[1] === 'number')
    return pluralize(args[0], `${args[0]}s`, ...args.slice(1));
  const [singular, plural, count, includeCount = false] = args;
  const pluralized = count === 1 ? singular : plural;
  return !includeCount ? pluralized : `${count.toLocaleString('en')} ${pluralized}`;
};
