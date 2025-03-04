
rm(list=ls())

##-- Load necessary libraries
library(dplyr)
library(kableExtra)
library(HSAUR3)
library(GGally)
library(ggplot2)      # For advanced plotting
library(FactoMineR)   # For PCA and supplementary variables
library(factoextra)   # For PCA visualization

# Load data
Diabetes <- read.csv("C:/Users/veron/Documents/UNI/2º/Septiembre/ME/Practica/Trabajo/Diabetes_processed.csv")

View(Diabetes)
summary(Diabetes)

# Només variables numèriques
numeric_diabetes_data <- Diabetes[, sapply(Diabetes, is.numeric)]
numeric_diabetes_data

##-- Escalar les dades
Diabetes_data_scaled <- scale(numeric_diabetes_data)

##-- Fer PCA
pca_result_D <- prcomp(Diabetes_data_scaled, center = TRUE)
pca_result_D

##-- Comparar
# VAPs
pca_result_D$sdev
sqrt(eigen(cov(Diabetes_data_scaled))$values)
# VEPs
pca_result_D$rotation[,1]
eigen(cov(Diabetes_data_scaled))$vec[,1]


##-- Scree Plot 
plot(pca_result_D)             # first option
plot(pca_result_D, type='l')   # second option
# third option
fviz_screeplot(pca_result_D, addlabels = TRUE, ylim = c(0, 60)) +
  ggtitle("Scree Plot: Variance Explained by Each Component") +
  xlab("Principal Component") +
  ylab("Percentage of Variance Explained")

# How many components?
summary(pca_result_D) 


# Representació gràfica
# Individus
fviz_pca_ind(pca_result_D, 
             repel = TRUE,          # Avoid overlapping text labels
             geom = c("point"),
             col.ind = "red",       # Color of individuals
             title = "Individuals") +
  theme_minimal()

# Variables
fviz_pca_var(pca_result_D, 
             repel = TRUE,          # Avoid overlapping text labels
             col.var = "blue",       # Color of individuals
             title = "Individuals") + theme_minimal()  

# Biplot- 1 i 2
fviz_pca_biplot(pca_result_D, 
                repel = TRUE,          # Avoid overlapping text labels
                geom = c("point"),
                col.var = "blue",      # Color of variable arrows
                col.ind = "red",       # Color of individuals
                alpha.ind = 0.4,
                title = "PCA Biplot de dades Diabetes") +
  theme_minimal()

# Biplot - 1 i 3
fviz_pca_biplot(pca_result_D,
                axes = c(1, 3),
                repel = TRUE,          # Avoid overlapping text labels
                geom = c("point"),
                col.var = "blue",      # Color of variable arrows
                col.ind = "red",       # Color of individuals
                alpha.ind = 0.4,
                title = "PCA Biplot de dades Diabetes") +
  theme_minimal()

# Biplot - 2 i 3
fviz_pca_biplot(pca_result_D,
                axes = c(2, 3),
                repel = TRUE,          # Avoid overlapping text labels
                geom = c("point"),
                col.var = "blue",      # Color of variable arrows
                col.ind = "red",       # Color of individuals
                alpha.ind = 0.4,
                title = "PCA Biplot de dades Diabetes") +
  theme_minimal()

# Pas extra- visualitzar la contribució de cada variable en color
#1 i 2
fviz_pca_var(pca_result_D, col.var = "contrib", 
             gradient.cols = c("blue", "yellow", "red"),
             title = "Contribution of Variables to PCA Components") +
  theme_minimal()

# 1 i 3
fviz_pca_var(pca_result_D,axes = c(1, 3), col.var = "contrib", 
             gradient.cols = c("blue", "yellow", "red"),
             title = "Contribution of Variables to PCA Components") +
  theme_minimal()

# 2 i 3
fviz_pca_var(pca_result_D,axes = c(2, 3), col.var = "contrib", 
             gradient.cols = c("blue", "yellow", "red"),
             title = "Contribution of Variables to PCA Components") +
  theme_minimal()
