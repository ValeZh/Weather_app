type Temperature = {
  Value: number;
  Unit: string;
  UnitType: number;
};

type DailyForecast = {
  Date: string;
  EpochDate: number;
  Temperature: {
    Minimum: Temperature;
    Maximum: Temperature;
  };
  Day: {
    Icon: number;
    IconPhrase: string;
    HasPrecipitation: boolean;
  };
  Night: {
    Icon: number;
    IconPhrase: string;
    HasPrecipitation: boolean;
  };
  MobileLink: string;
  Link: string;
};

type WeatherHeadline = {
  EffectiveDate: string;
  EffectiveEpochDate: number;
  Severity: number;
  Text: string;
  Category: string;
  EndDate: string | null;
  EndEpochDate: number | null;
  MobileLink: string;
  Link: string;
};

export type WeatherData = {
  Headline: WeatherHeadline;
  DailyForecasts: DailyForecast[];
};



type Region = {
  ID: string;
  LocalizedName: string;
};

export type RegionData = Region[];


type Country = {
  ID: string;
  LocalizedName: string;
  EnglishName: string;
};

export type CountryData = Country[];

export type City = {
  ID: string;
  LocalizedName: string;
  EnglishName: string;
  Level: number;
  LocalizedType: string;
  EnglishType: string;
  CountryID: string;
};

export type CityData = City[];

export type CitySearchResultMinimal = {
  Key: string;
  EnglishName: string;
  Country: {
    ID: string;
    LocalizedName: string;
  };
};

export type CitySearchDataMinimal = CitySearchResultMinimal[];