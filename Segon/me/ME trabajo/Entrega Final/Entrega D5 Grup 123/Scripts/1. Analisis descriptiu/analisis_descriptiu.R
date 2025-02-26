

library(dplyr)
library(tidyverse)
library(summarytools)
library(ggplot2)
library(ggcorrplot)
library(GGally)
library(FactoMineR)
library(factoextra)
library(purrr)
library(knitr)
library(gridExtra)
library(rmarkdown)

data <- read_csv("C:\\Users\\albert\\Desktop\\descriptiu\\base_principal_processed.csv")
head(data)
str(data)
print(dfSummary(data, method = 'render', file = "dfSummary.html"))
descr(data)

# histogramas
plot_histogram <- function(col, binwidth = 1, fill_color = "#ADD8E6") {
  ggplot(data, aes_string(x = col)) +
    geom_histogram(binwidth = binwidth, fill = fill_color, color = "Black") +
    theme_minimal()
}

numeric_cols <- data %>% select_if(is.numeric) %>% colnames()
print(numeric_cols)

plots <- lapply(numeric_cols, function(col) {
  plot_histogram(col, binwidth = 2, fill_color = "#ADD8E6")
})

grid.arrange(grobs = plots, ncol = 3)

# boxplots
plot_boxplot <- function(col, title = NULL, fill_color = "#ADD8E6") {
  ggplot(data, aes_string(y = col)) + 
    geom_boxplot(fill = fill_color, color = "black") + 
    scale_fill_brewer(palette="Pastel1") + 
    theme_minimal() + 
    ggtitle(ifelse(is.null(title), paste(col), title))
}

boxplots <- map(numeric_cols, ~plot_boxplot(.x, fill_color = "#ADD8E6"))

grid.arrange(grobs = boxplots, ncol = 2)

# barplots
categorical_cols <- data %>% select_if(is.character) %>% colnames()
print(categorical_cols)

plot_barplot_base <- function(data, col) {
  counts <- table(data[[col]])
  total <- sum(counts)
  bar_positions <- barplot(counts, 
                           main = paste(col),
                           col = "#ADD8E6",
                           las = 2,
                           cex.names = 0.8)
  
  text(bar_positions, counts, labels = counts, pos = 3, cex = 0.8)
  
  percentages <- round((counts / total) * 100, 1)
  text(bar_positions, counts, labels = paste0(percentages, "%"), pos = 1, cex = 0.8, col = "black")
}

par(mfrow = c(2, 2))

for (col in categorical_cols) {
  plot_barplot_base(data, col)
}

par(mfrow = c(1, 1))

# Pruebas de chi-cuadrado
numeric_vars <- data %>% select_if(is.numeric)
categorical_vars <- data %>% select_if(is.character)

cat_names <- colnames(categorical_vars)
chi_squared_results <- list()

for (i in 1:(ncol(categorical_vars)-1)) {
  for (j in (i+1):ncol(categorical_vars)) {
    table <- table(categorical_vars[[i]], categorical_vars[[j]])
    chi_test <- chisq.test(table)
    chi_squared_results[[paste(cat_names[i], "vs", cat_names[j], sep = " ")]] <- chi_test
  }
}

compact_results <- data.frame(
  Variables = character(),
  P_Value = numeric(),
  Significance = character(),
  stringsAsFactors = FALSE
)

for (result in names(chi_squared_results)) {
  p_value <- chi_squared_results[[result]]$p.value
  significance <- ifelse(p_value < 0.05, "Significant", "Not Significant")
  if (significance == "Significant") {
    compact_results <- rbind(compact_results, data.frame(
      Variables = result, 
      P_Value = p_value, 
      Significance = significance
    ))
  }
}

print(compact_results)

# Heatmap
cor_matrix <- cor(numeric_vars)
ggcorrplot(cor_matrix,
           hc.order = TRUE,
           type = "lower",
           lab = TRUE,
           lab_size = 3,
           tl.cex = 1.2,
           method = "circle",
           colors = c("tomato2", "white", "springgreen3"),
           title = "Mapa de Calor de Correlacions",
           ggtheme = theme_bw()) +
  theme(axis.text.x = element_text(angle = 45, hjust = 1, size = 12),
        axis.text.y = element_text(size = 12))

# ANOVA
combinations <- list(
  c("Target", "Genetic.Markers"),
  c("Autoantibodies", "Early.Onset.Symptoms"),
  c("Environmental.Factors", "Smoking.Status"),
  c("Previous.Gestational.Diabetes", "Urine.Test")
)

anova_results <- do.call(rbind, lapply(combinations, function(comb) {
  cat_var <- comb[2]
  do.call(rbind, lapply(numeric_vars, function(num_var) {
    formula <- as.formula(paste(num_var, "~", cat_var))
    anova_result <- tryCatch(aov(formula, data = data), error = function(e) NULL)
    
    if (!is.null(anova_result)) {
      p_value <- summary(anova_result)[[1]]["Pr(>F)"][1, 1]
      significance <- ifelse(p_value < 0.001, "***", 
                             ifelse(p_value < 0.01, "**", 
                                    ifelse(p_value < 0.05, "*", "Not Significant")))
      
      data.frame(
        Combination = paste(comb[1], "vs", comb[2]),
        Numerical_Variable = num_var,
        P_Value = p_value,
        Significance = significance,
        stringsAsFactors = FALSE
      )
    } else {
      NULL
    }
  }))
}))

anova_results <- anova_results %>% select(Combination, Numerical_Variable, Significance)

kable(anova_results, format = "html", table.attr = "style='width:100%;'", row.names = FALSE)


