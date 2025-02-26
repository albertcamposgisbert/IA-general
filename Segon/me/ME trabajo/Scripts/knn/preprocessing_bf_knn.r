library(dplyr)
library(readr)

dataset <- read_csv("./dataset_imputado.csv", show_col_types = FALSE)

# Eliminar múltiples columnas
# dataset <- dataset %>%
#   select(-HDMI_Connection, -Process, -Shader, -TMUs, -Texture_Rate)
# 
# dataset <- dataset %>%
#   mutate(Core_Speed = na_if(as.character(Core_Speed), 'NA')) %>%
#   mutate(Core_Speed = gsub("\n", "", Core_Speed)) %>%
#   mutate(Core_Speed = parse_number(Core_Speed)) %>%
#   mutate(Memory_Bandwidth = na_if(as.character(Memory_Bandwidth), 'NA')) %>%
#   mutate(Memory_Bandwidth = gsub("\n", "", Memory_Bandwidth)) %>%
#   mutate(Memory_Bandwidth = parse_number(Memory_Bandwidth)) %>%
#   mutate(ROPs = na_if(as.character(ROPs), 'NA')) %>%
#   mutate(ROPs = gsub("\n", "", ROPs)) %>%
#   mutate(ROPs = parse_number(ROPs))
#   
# write_csv(dataset, "./dataset_modificado.csv")
# 
# View(dataset)

missing_percentages <- dataset %>%
  summarise(across(where(is.numeric), ~ mean(is.na(.)) * 100))

print(missing_percentages)