
# Profiling
################################################################################


rm(list = ls()) 
library(ggpubr)        
library(FactoMineR)    
library(psych)         
library(ggplot2)       


mi_dataset <- read.csv("C:/Users/marit/Desktop/uni/3rq/me/diabetes/final/database_diab.csv")

set.seed(123)
n_red <- 1000
s <- sample(1:nrow(mi_dataset), n_red)
datos_reducidos <- mi_dataset[s, ]

variables_submuestra <- datos_reducidos[, c("Age", "BMI", "Blood.Pressure", "Cholesterol.Levels", "Blood.Glucose.Levels", "Insulin.Levels")]
variables_escaladas <- scale(variables_submuestra)

##########################################################################################
#Execució del clustering
##########################################################################################
pca_res <- prcomp(variables_escaladas, scale. = TRUE)
variables_pca <- as.data.frame(pca_res$x[, 1:2]) 

set.seed(12345)
km0 <- kmeans(variables_pca, centers = 3)
variables_pca$cluster <- factor(km0$cluster)

# ===========================================
# Profiling
# ===========================================

pathProfiling_p <- "Profiling_p/"
if (!dir.exists(pathProfiling_p)) dir.create(pathProfiling_p)

##########################################################################################
#Validació de variables
##########################################################################################
columns_validate <- colnames(variables_pca)[!colnames(variables_pca) %in% "cluster"]

significant_vars <- c()

sink(file = paste0(pathProfiling_p, "Test_stage1.txt"))
for (cV in columns_validate) {
  current_var <- variables_pca[, cV]
  
  if (is.numeric(current_var)) {
    testSH <- shapiro.test(current_var)
    cat("============ ", cV, " ================\n")
    print(testSH); cat("\n")
    
    if (testSH$p.value > 0.05) {
      anova <- aov(current_var ~ variables_pca$cluster)
      print(summary(anova))
      p_valor <- summary(anova)[[1]][["Pr(>F)"]][1]
      
      if (p_valor <= 0.05) {
        significant_vars <- c(significant_vars, cV)
      }
    } else {
      test <- kruskal.test(current_var ~ variables_pca$cluster)
      print(test)
      
      if (test$p.value <= 0.05) {
        significant_vars <- c(significant_vars, cV)
      }
    }
    
    gr_Boxplot <- ggboxplot(variables_pca, x = "cluster", y = cV, fill = "cluster")
    gr_Hist    <- gghistogram(variables_pca, x = cV, add = "mean", rug = TRUE, fill = "cluster")
    gr         <- ggarrange(gr_Boxplot, gr_Hist, heights = c(2, 0.7), ncol = 2, nrow = 1, align = "v")
    ggsave(filename = paste0(pathProfiling_p, "clustering_var_", cV, ".png"), plot = gr, bg = "white", width = 6, height = 3)
  }
}

sink()

sink(file = paste0(pathProfiling_p, "Centroides.txt"))
if (length(significant_vars) > 0) {
  describeBy(variables_pca[, significant_vars, drop = FALSE], group = variables_pca$cluster)
}
sink()

##########################################################################################
#Significancia de modalitats
##########################################################################################
variables_escaladas$cluster <- factor(km0$cluster)

res_catdes <- catdes(variables_escaladas, num.var = ncol(variables_escaladas))

print(res_catdes)

plot(res_catdes, show = "quanti", col.upper = "red", col.lower = "blue", barplot = TRUE, cex.names = 1)
plot(res_catdes, show = "all", col.upper = "red", col.lower = "blue", barplot = FALSE, cex.names = 2)

ggplot(variables_pca, aes(x = cluster, y = PC1, fill = cluster)) +
  geom_violin(trim = FALSE) +
  labs(title = "Densidad de PC1 por cluster", y = "PC1") +
  theme_minimal()

ggplot(variables_pca, aes(x = cluster, y = PC2, fill = cluster)) +
  geom_violin(trim = FALSE) +
  labs(title = "Densidad de PC2 por cluster", y = "PC1") +
  theme_minimal()


