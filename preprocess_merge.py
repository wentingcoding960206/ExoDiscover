import pandas as pd
import numpy as np

def load_nasa_csv(filepath):
    """Load NASA CSV files that have comment headers."""
    try:
        return pd.read_csv(filepath, comment='#')
    except:
        try:
            with open(filepath, 'r') as f:
                lines = f.readlines()
            data_start = next(
                (i for i, line in enumerate(lines)
                 if not line.strip().startswith('#') and len(line.split(',')) > 1),
                0
            )
            return pd.read_csv(filepath, skiprows=data_start, comment='#')
        except Exception as e:
            print(f"⚠️ Could not read {filepath}: {e}")
            return pd.DataFrame()

def clean_and_merge_exoplanets():
    """Load, clean, and merge Kepler, K2, and TESS datasets into a clean numeric format."""
    print("🪐 Loading datasets...")
    kepler_df = load_nasa_csv('data/kepler.csv')
    k2_df = load_nasa_csv('data/k2.csv')
    tess_df = load_nasa_csv('data/tess.csv')

    # --- Kepler ---
    kepler_clean = pd.DataFrame()
    if not kepler_df.empty:
        kepler_clean['planet_name'] = kepler_df.get('kepler_name', kepler_df.get('kepoi_name', ''))
        kepler_clean['planet_id'] = pd.to_numeric(kepler_df['kepid'], errors='coerce')
        kepler_clean['orbital_period'] = kepler_df.get('koi_period')
        kepler_clean['planet_radius'] = kepler_df.get('koi_prad')
        kepler_clean['transit_depth'] = kepler_df.get('koi_depth')
        kepler_clean['transit_duration'] = kepler_df.get('koi_duration')
        kepler_clean['eq_temperature'] = kepler_df.get('koi_teq')
        kepler_clean['insolation_flux'] = kepler_df.get('koi_insol')
        kepler_clean['stellar_temp'] = kepler_df.get('koi_steff')
        kepler_clean['stellar_radius'] = kepler_df.get('koi_srad')
        kepler_clean['stellar_gravity'] = kepler_df.get('koi_slogg')
        if 'koi_disposition' in kepler_df:
            disposition_map = {'CONFIRMED': 2, 'CANDIDATE': 1, 'FALSE POSITIVE': 0}
            kepler_clean['disposition'] = kepler_df['koi_disposition'].map(disposition_map)
        kepler_clean['source'] = 'Kepler'

    # --- K2 ---
    k2_clean = pd.DataFrame()
    if not k2_df.empty:
        k2_clean['planet_name'] = k2_df.get('pl_name', k2_df.get('hostname', '') + ' b')
        k2_clean['planet_id'] = (k2_df.get('hostname', '') + k2_df.get('disc_year', '').astype(str)) \
                                    .apply(lambda x: abs(hash(x)) % 10**10)
        k2_clean['orbital_period'] = k2_df.get('pl_orbper')
        k2_clean['planet_radius'] = k2_df.get('pl_rade')
        k2_clean['eq_temperature'] = k2_df.get('pl_eqt')
        k2_clean['insolation_flux'] = k2_df.get('pl_insol')
        k2_clean['stellar_temp'] = k2_df.get('st_teff')
        k2_clean['stellar_radius'] = k2_df.get('st_rad')
        k2_clean['stellar_gravity'] = k2_df.get('st_logg')
        if 'disposition' in k2_df:
            disposition_map = {'Confirmed': 2, 'Candidate': 1, 'False Positive': 0}
            k2_clean['disposition'] = k2_df['disposition'].map(disposition_map)
        k2_clean['source'] = 'K2'

    # --- TESS ---
    tess_clean = pd.DataFrame()
    if not tess_df.empty:
        if 'toi' in tess_df:
            tess_clean['planet_name'] = 'TOI ' + tess_df['toi'].astype(str)
            tess_clean['planet_id'] = pd.to_numeric(tess_df['toi'], errors='coerce')
        elif 'tid' in tess_df:
            tess_clean['planet_name'] = 'TIC ' + tess_df['tid'].astype(str)
            tess_clean['planet_id'] = pd.to_numeric(tess_df['tid'], errors='coerce')
        else:
            tess_clean['planet_name'] = np.nan
            tess_clean['planet_id'] = np.nan
        tess_clean['orbital_period'] = tess_df.get('pl_orbper')
        tess_clean['planet_radius'] = tess_df.get('pl_rade')
        tess_clean['transit_depth'] = tess_df.get('pl_trandep')
        tess_clean['transit_duration'] = tess_df.get('pl_trandurh')
        tess_clean['eq_temperature'] = tess_df.get('pl_eqt')
        tess_clean['insolation_flux'] = tess_df.get('pl_insol')
        tess_clean['stellar_temp'] = tess_df.get('st_teff')
        tess_clean['stellar_radius'] = tess_df.get('st_rad')
        tess_clean['stellar_gravity'] = tess_df.get('st_logg')
        if 'tfopwg_disp' in tess_df:
            disposition_map = {'CP': 2, 'KP': 1, 'PC': 1, 'FP': 0}
            tess_clean['disposition'] = tess_df['tfopwg_disp'].map(disposition_map)
        tess_clean['source'] = 'TESS'

    # --- Merge all ---
    all_dfs = [df for df in [kepler_clean, k2_clean, tess_clean] if not df.empty]
    if not all_dfs:
        print("❌ No datasets loaded!")
        return None

    merged_df = pd.concat(all_dfs, ignore_index=True)

    # --- Cleaning ---
    merged_df.dropna(subset=['planet_id', 'orbital_period'], inplace=True)
    merged_df.reset_index(drop=True, inplace=True)

    # Ensure numeric types
    numeric_cols = ['planet_id', 'orbital_period', 'planet_radius', 'transit_depth',
                    'transit_duration', 'eq_temperature', 'insolation_flux',
                    'stellar_temp', 'stellar_radius', 'stellar_gravity', 'disposition']
    for col in numeric_cols:
        if col in merged_df.columns:
            merged_df[col] = pd.to_numeric(merged_df[col], errors='coerce')

    # Save clean dataset
    merged_df.to_csv('data/merged_cleaned.csv', index=False)
    print(f"✅ Clean merged dataset saved: {len(merged_df)} rows | columns: {list(merged_df.columns)}")
    
    return merged_df

if __name__ == "__main__":
    clean_and_merge_exoplanets()
