library(readr)

# Leer los datasets
dataset <- read_csv("./dataset_modificado.csv", show_col_types = FALSE)
dataset2 <- read_csv("./imputed_data.csv", show_col_types = FALSE)

# Obtener el número de columnas y filas del primer dataset
num_columns_dataset <- ncol(dataset)
num_rows_dataset <- nrow(dataset)

# Obtener el número de columnas y filas del segundo dataset
num_columns_dataset2 <- ncol(dataset2)
num_rows_dataset2 <- nrow(dataset2)

# Visualizar los datasets
View(dataset)
View(dataset2)

# Imprimir el número de columnas y filas
print(paste("Número de columnas en dataset:", num_columns_dataset))
print(paste("Número de filas en dataset:", num_rows_dataset))

print(paste("Número de columnas en dataset2:", num_columns_dataset2))
print(paste("Número de filas en dataset2:", num_rows_dataset2))

# Contar el número de missings por columna en dataset2
missing_counts <- sapply(dataset2, function(x) sum(is.na(x)))

# Imprimir el número de missings por columna
print(missing_counts)