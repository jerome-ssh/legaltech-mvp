import { Country, State } from 'country-state-city';
import { Option } from '@/components/ui/searchable-select';

// Get all countries
export const getAllCountries = (): Option[] => {
  const countries = Country.getAllCountries();
  return countries.map(country => ({
    label: country.name,
    value: country.isoCode
  })).sort((a, b) => a.label.localeCompare(b.label));
};

// Get all states for a country by its ISO code
export const getStatesByCountry = (countryCode: string): Option[] => {
  if (!countryCode) return [];
  
  const states = State.getStatesOfCountry(countryCode);
  return states.map(state => ({
    label: state.name,
    value: state.isoCode
  })).sort((a, b) => a.label.localeCompare(b.label));
};

// Get popular/common countries at the top of the list
export const getPopularCountries = (): Option[] => {
  const popularCountryCodes = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IN', 'JP', 'BR', 'ZA'];
  const countries = Country.getAllCountries();
  
  // First get the popular countries in the specified order
  const popularCountries = popularCountryCodes
    .map(code => countries.find(country => country.isoCode === code))
    .filter(Boolean) // Remove any undefined values
    .map(country => ({
      label: country!.name,
      value: country!.isoCode
    }));
  
  return popularCountries;
};

// Get a combined list with popular countries first, then all others
export const getCountriesWithPopularFirst = (): Option[] => {
  const popularCountries = getPopularCountries();
  const allCountries = getAllCountries();
  
  // Filter out countries that are already in the popular list
  const otherCountries = allCountries.filter(
    country => !popularCountries.some(popular => popular.value === country.value)
  );
  
  return [...popularCountries, ...otherCountries];
};

// Get the country name from its ISO code
export const getCountryNameByCode = (countryCode: string): string => {
  if (!countryCode) return '';
  
  const country = Country.getCountryByCode(countryCode);
  return country?.name || '';
};

// Get the state name from its ISO code and country ISO code
export const getStateNameByCode = (countryCode: string, stateCode: string): string => {
  if (!countryCode || !stateCode) return '';
  
  const state = State.getStateByCodeAndCountry(stateCode, countryCode);
  return state?.name || '';
}; 