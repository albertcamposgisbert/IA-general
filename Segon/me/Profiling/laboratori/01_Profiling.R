rm(ist=ls())

# Load necessary libraries
library(clustMixType)  # k-prototypes clustering
library(arules)        # 'adult' dataset
library(dplyr)         # Data manipulation
library(ggplot2)       # graphics

# Load the adult dataset
data("AdultUCI")
df <- AdultUCI

# Select a subset of columns for simplicity (numeric and categorical)
df_subset <- df %>%
  select(age, education, occupation, 'hours-per-week', income) %>%
  na.omit() %>% # Remove rows with missing values
  mutate_if(is.factor, as.character)

# Define the number of clusters
k <- 3

# Apply k-prototypes clustering
set.seed(12345)  
kproto_result <- kproto(df_subset, k, type = 'gower')

# Add cluster assignments to the dataset
df_subset$cluster <- factor(kproto_result$cluster)

# Summary: numeric --> numeric variable
aggregate(df_subset$age,
          by = list(cluster = df_subset$cluster),
          FUN = summary)

# Summary: graphic --> numeric variable
ggplot(df_subset, aes(x = cluster, y = age)) +
  geom_boxplot() +
  labs(title="Age by Cluster",x="Cluster",y="Years")

# Summary: numeric --> categorical variable
round(with(df_subset, prop.table(table(cluster, income),1)),2)

# Summary: graphic --> categorical variable
ggplot(df_subset, aes(x = cluster, fill = factor(income))) +
  geom_bar(position = "fill") +
  labs(title="income by Cluster",x="Cluster",y="Proportion") +
  scale_fill_discrete(name = "income")

# Compare clusters based on the "age" variable using ANOVA and Kruskal-Wallis
# ANOVA: Assumes normally distributed data
anova_result <- aov(age ~ cluster, data = df_subset)
summary(anova_result)

# Kruskal-Wallis test: Non-parametric equivalent to ANOVA
kruskal_result <- kruskal.test(age ~ cluster, data = df_subset)
kruskal_result

# Compare clusters based on "income" (categorical) using Chi-squared test
income_table <- with(df_subset, table(income, cluster))
chisq_result <- chisq.test(income_table)
print(chisq_result)

