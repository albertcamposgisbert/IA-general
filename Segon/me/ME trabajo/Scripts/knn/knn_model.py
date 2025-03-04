import numpy as np
import pandas as pd
from sklearn.impute import KNNImputer
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error

def compare_datasets(original_data, imputed_data):
    comparison = {}

    original_stats = original_data.describe()
    imputed_stats = imputed_data.describe()
    comparison['statistics'] = pd.concat([original_stats, imputed_stats], axis=1, keys=['original_data', 'imputed_data'])

    return comparison

def remove_random_values(data):
    data_with_missing = data.copy()
    np.random.seed(42)
    
    for column in data.columns:
        num_missing = int(0.2 * data.shape[0])
        missing_indices = np.random.choice(data.index, num_missing, replace=False)
        data_with_missing.loc[missing_indices, column] = np.nan
    
    return data_with_missing

def find_best_k(train_data, test_data, max_k=10):
    train_data_removed = remove_random_values(train_data)
    val_data = remove_random_values(test_data).reindex(test_data.index)
    
    best_k_values = []
    for column in train_data_removed.columns:
        best_k = 1
        best_score = float('inf')
        for k in range(1, max_k + 1):
            imputer = KNNImputer(n_neighbors=k)
            imputer.fit(train_data_removed)
            val_data_imputed = imputer.transform(val_data)
            MSE = mean_squared_error(test_data[column].loc[val_data.index], 
                    val_data_imputed[:, val_data.columns.get_loc(column)])
            MAE = mean_absolute_error(test_data[column].loc[val_data.index], 
                    val_data_imputed[:, val_data.columns.get_loc(column)])
            
            # Penalización adicional para valores altos
            penalty = np.mean(np.maximum(0, val_data_imputed[:, val_data.columns.get_loc(column)] - test_data[column].loc[val_data.index]))
            score = MSE + MAE + penalty # Métrica compuesta
            if score < best_score:
                best_score = score
                best_k = k
        best_k_values.append(best_k)
    
    return best_k_values

def apply_knn_imputer(data, best_k_values):
    imputer = KNNImputer(n_neighbors=max(best_k_values))
    imputed_data = imputer.fit_transform(data)
    return pd.DataFrame(imputed_data, columns=data.columns)


numeric_data_original = pd.read_csv('dataset_modificado.csv').select_dtypes(include=[np.number])
data = pd.read_csv('dataset_modificado.csv')
clean_data = data.dropna().copy()

numeric_data = clean_data.select_dtypes(include=[np.number])
non_numeric_data = clean_data.select_dtypes(exclude=[np.number])


train_data, test_data = train_test_split(numeric_data, test_size=0.2, random_state=42)
best_k_values = find_best_k(train_data, test_data, max_k=10)


numeric_data_with_imputed = apply_knn_imputer(numeric_data_original, best_k_values)

imputed_data = pd.concat([numeric_data_with_imputed, data.select_dtypes(exclude=[np.number])], axis=1)
imputed_data.to_csv('imputed_data.csv', index=False)

analysis = compare_datasets(numeric_data, numeric_data_with_imputed)

pd.set_option('display.max_columns', None)
pd.set_option('display.max_rows', None)

print("Análisis descriptivo del dataset original:")
print(analysis['statistics']['original_data'])
print("\nAnálisis descriptivo del dataset con datos imputados:")
print(analysis['statistics']['imputed_data'])


