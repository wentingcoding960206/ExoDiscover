import pandas as pd
from astropy.coordinates import SkyCoord
from astropy import units as u

# -----------------------------
# 1. Load datasets (skip comment lines)
# -----------------------------
kepler_df = pd.read_csv('kepler.csv', comment='#')
tess_df   = pd.read_csv('tess.csv', comment='#')
k2_df     = pd.read_csv('k2.csv', comment='#')

# -----------------------------
# 2. Define common columns
# -----------------------------
column_map = {
    # Planet identifiers
    'planet_name': ['kepoi_name', 'kepler_name', 'toi', 'pl_name'],
    
    # Orbital properties
    'orbital_period_days': ['koi_period', 'pl_orbper'],
    'transit_midpoint_bjd': ['koi_time0bk', 'pl_tranmid'],
    'transit_duration_hrs': ['koi_duration', 'pl_trandurh'],
    'transit_depth_ppm': ['koi_depth', 'pl_trandep'],
    'planet_radius_earth': ['koi_prad', 'pl_rade'],
    'equilibrium_temp_k': ['koi_teq', 'pl_eqt'],
    'insolation_earthflux': ['koi_insol', 'pl_insol'],

    # Stellar properties
    'stellar_teff_k': ['koi_steff', 'st_teff'],
    'stellar_radius_sun': ['koi_srad', 'st_rad'],
    'stellar_logg_cgs': ['koi_slogg', 'st_logg'],

    # Sky coordinates
    'ra_deg': ['ra'],
    'dec_deg': ['dec']
}

# -----------------------------
# 3. Rename columns
# -----------------------------
def rename_columns(df, source):
    rename_dict = {}
    for common_name, options in column_map.items():
        for opt in options:
            if opt in df.columns:
                rename_dict[opt] = common_name
                break
    df = df.rename(columns=rename_dict)
    df['source'] = source  # optional column to keep track
    return df

kepler_df = rename_columns(kepler_df, 'Kepler')
tess_df   = rename_columns(tess_df, 'TESS')
k2_df     = rename_columns(k2_df, 'K2')

# -----------------------------
# 4. Keep only standardized columns
# -----------------------------
all_columns = list(column_map.keys()) + ['source']
kepler_df = kepler_df.reindex(columns=all_columns)
tess_df   = tess_df.reindex(columns=all_columns)
k2_df     = k2_df.reindex(columns=all_columns)

# -----------------------------
# 5. Combine datasets
# -----------------------------
combined_df = pd.concat([kepler_df, tess_df, k2_df], ignore_index=True)

# -----------------------------
# 6. Optional: merge duplicates by RA/Dec (1 arcsec tolerance)
# -----------------------------
def merge_duplicates(df, tol_arcsec=1.0):
    coords = SkyCoord(ra=df.ra_deg.values*u.deg, dec=df.dec_deg.values*u.deg)
    idx1, idx2, sep2d, _ = coords.match_to_catalog_sky(coords)
    unique_mask = sep2d.arcsec > tol_arcsec
    return df[unique_mask]

# combined_df = merge_duplicates(combined_df)  # uncomment if you want to deduplicate

# -----------------------------
# 7. Save final dataset
# -----------------------------
combined_df.to_csv('combined_exoplanets.csv', index=False)
print("Combined dataset saved to 'combined_exoplanets.csv'")
