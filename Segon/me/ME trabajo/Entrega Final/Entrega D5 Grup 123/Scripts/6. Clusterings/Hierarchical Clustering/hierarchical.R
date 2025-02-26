################################################################################
#
# i. Precise description of the data used (which variables have been included in the analysis)
# ii. Clustering method used: metrics and aggregation criteria used
# iii. Dendrogram. 
# iv. Discuss about how to get the final number of clusters
# v. Table with a description of the clusters size
# 
#
#
################################################################################
rm(list=ls())
setwd("C:\\Users\\albert\\Desktop\\hierarchicalClustering")


library(NbClust)
library(factoextra)
library(hopkins)
library(FactoMineR)
library(dendextend)
library(ggcorrplot)
library(dendextend)
library(corrplot)
library(cluster)
library(clustMixType)
library(pheatmap)

################################################################################
# Inspect data
################################################################################

dataset <- read.csv('base_principal.csv')
dim(dataset) 
summary(dataset)

num_frame <- with(dataset, data.frame (Insulin.Levels, Age, BMI, Blood.Pressure, Cholesterol.Levels, Blood.Glucose.Levels, Pancreatic.Health))
num_frame_scaled <- scale(num_frame)


cor_matrix <- cor(num_frame_scaled)
ggcorrplot(cor_matrix,
           hc.order = TRUE,
           type = "lower",
           lab = TRUE,
           lab_size = 3,
           tl.cex = 1.2,
           method = "circle",
           colors = c("tomato2", "white", "springgreen3"),
           title = "Heatmap de correlacions",
           ggtheme = theme_bw()) +
  theme(axis.text.x = element_text(angle = 45, hjust = 1, size = 12),
        axis.text.y = element_text(size = 12))

set.seed(1234567)

n_total <- nrow(num_frame_scaled)
n_red <- 1000
s <- sample(1:n_total, n_red)
num_frame_scaled_red <- num_frame_scaled[s,]


data_matrix = as.matrix(num_frame_scaled_red)
heatmap(data_matrix, scale = "none", 
        col = colorRampPalette(c("blue", "white", "red"))(256), 
        ylab = "Observacions")


################################################################################
# Hierarchical clustering 
################################################################################

fviz_dist(dist(num_frame_scaled_red))

# Cálculo de la matriz de distancia
d1 <- dist(num_frame_scaled_red, method = 'euclidean')
d2 <- dist(num_frame_scaled_red, method = 'manhattan')
d3 <- dist(num_frame_scaled_red, method = 'maximum')


# Euclidiana
hc1 <- hclust(as.dist(d1), method = "ward.D2")
hc2 <- hclust(as.dist(d1), method = "complete")
hc3 <- hclust(as.dist(d1), method = "average")
hc4 <- hclust(as.dist(d1), method = "single")

# Manhattan
hc5 <- hclust(as.dist(d2), method = "ward.D2")
hc6 <- hclust(as.dist(d2), method = "complete")
hc7 <- hclust(as.dist(d2), method = "average")
hc8 <- hclust(as.dist(d2), method = "single")

# Chebyshev
hc9 <- hclust(as.dist(d3), method = "ward.D2")
hc10 <- hclust(as.dist(d3), method = "complete")
hc11 <- hclust(as.dist(d3), method = "average")
hc12 <- hclust(as.dist(d3), method = "single")

windows(10, 10)
par(mfrow=c(2,1), las=1)

plot(hc1, cex=0.7, main="Dendrograma (Euclidiana - Ward.D2)")
plot(hc2, cex=0.7, main="Dendrograma (Euclideana - Complete)")
plot(hc3, cex=0.7, main="Dendrograma (Euclideana - Average)")
plot(hc4, cex=0.7, main="Dendrograma (Euclideana - Single)")

windows(10, 10)
par(mfrow=c(2,1), las=1)

plot(hc5, cex=0.7, main="Dendrograma (Manhattan - Ward.D2)")
plot(hc6, cex=0.7, main="Dendrograma (Manhattan - Complete)")
plot(hc7, cex=0.7, main="Dendrograma (Manhattan - Average)")
plot(hc8, cex=0.7, main="Dendrograma (Manhattan - Single)")


windows(10, 10)
par(mfrow=c(2,1), las=1)

plot(hc9, cex=0.7, main="Dendrograma (Chebyshev - Ward.D2)")
plot(hc10, cex=0.7, main="Dendrograma (Chebyshev - Complete)")
plot(hc11, cex=0.7, main="Dendrograma (Chebyshev - Average)")
plot(hc12, cex=0.7, main="Dendrograma (Chebyshev - Single)")

################################################################################
# Clustering quality (Coeficients cophenetics de versemblança)
################################################################################

# Euclidiana
cop.dist <- cophenetic(hc1)
cor(d1, cop.dist)
cop.dist <- cophenetic(hc2)
cor(d1, cop.dist)
cop.dist <- cophenetic(hc3)
cor(d1, cop.dist) # 0.73 (euclidiana - average)
cop.dist <- cophenetic(hc4)
cor(d1, cop.dist)

# Manhattan
cop.dist <- cophenetic(hc5)
cor(d2, cop.dist)
cop.dist <- cophenetic(hc6)
cor(d2, cop.dist)
cop.dist <- cophenetic(hc7)
cor(d2, cop.dist)
cop.dist <- cophenetic(hc8)
cor(d2, cop.dist)

# Chebyshev
cop.dist <- cophenetic(hc9)
cor(d3, cop.dist)
cop.dist <- cophenetic(hc10)
cor(d3, cop.dist)
cop.dist <- cophenetic(hc11)
cor(d3, cop.dist)
cop.dist <- cophenetic(hc12)
cor(d3, cop.dist)


################################################################################
# Partition
################################################################################

fviz_nbclust(num_frame_scaled_red, hcut, method = "wss") +
  labs(title = "Nombre òptim de clusters (WSS)", x = "Nombre de clusters", y = "WSS")

fviz_nbclust(num_frame_scaled_red, hcut, method = "silhouette") +
  labs(title = "Nombre òptim de clusters (Silhouette)", x = "Nombre de clusters", y = "Silhouette")

fviz_nbclust(num_frame_scaled_red, hcut, method = "gap_stat") +
  labs(title = "Nombre òptim de clusters (Gap Statistic)", x = "Nombre de clusters", y = "Gap Statistic")


nb <- NbClust(num_frame_scaled_red, distance = "euclidean", min.nc = 4, max.nc = 9, method = "ward.D2")

num_clusters <- 4:9

metricas <- c("KL", "CH", "Hartigan", "CCC", "Scott", "Marriot", "TrCovW", "TraceW", 
              "Friedman", "Rubin", "Cindex", "DB", "Silhouette", 
              "Dunn", "Gamma", "Gplus", "Tau", "SDbw", "RayTuri", "S", 
              "MCClainRao", "PBM", "Ratkowsky", "Ball", "PtBiserial", "KrzanowskiLai", 
              "C-Index", "Z-index")

metricas_disponibles <- metricas[metricas %in% colnames(nb$All.index)]

nb_data <- data.frame()

for (metrica in metricas_disponibles) {
  values <- nb$All.index[, metrica, drop = FALSE]
  optimal_cluster <- nb$Best.nc[1, metrica]
  df_metrica <- data.frame(
    Clusters = num_clusters,
    Measure = metrica,
    Value = values[,1],
    Optimal = ifelse(num_clusters == optimal_cluster, optimal_cluster, NA)
  )
  nb_data <- rbind(nb_data, df_metrica)
}


nb_data$Optimal <- as.numeric(as.character(nb_data$Optimal))

ggplot(nb_data, aes(x = Clusters, y = Value, color = Measure)) +
  geom_line() +
  geom_point() +
  facet_wrap(~ Measure, scales = "free_y") +
  geom_vline(data = nb_data[!is.na(nb_data$Optimal),], aes(xintercept = Optimal), linetype = "dashed", color = "red") +
  ggtitle("Comparativa de métriques adicionals del NBclust") +
  xlab("óptim de Clústers") +
  ylab("Valor de la Métrica") +
  theme_minimal()



#nb <- NbClust(num_frame_scaled_red, distance = "euclidean", min.nc = 3, max.nc = 10, method = "average")
#nb <- NbClust(num_frame_scaled_red, distance = "manhattan", min.nc = 3, max.nc = 10, method = "average")

ct_1 <- cutree(hc1,4)
ct_2 <- cutree(hc1,5)
ct_3 <- cutree(hc1,6)
#ct_3 <- cutree(hc3,5)
#ct_7 <- cutree(hc7,5)
pairs(num_frame_scaled_red, main = "Pairs amb 4 clusters", col = ct_1, pch = 19, cex = 0.8)
pairs(num_frame_scaled_red, main = "Pairs amb 5 clusters", col = ct_2, pch = 19, cex = 0.8)
pairs(num_frame_scaled_red, main = "Pairs amb 6 clusters", col = ct_3, pch = 19, cex = 0.8)

#pairs(num_frame_scaled_red, col = ct_3, pch = 19, cex = 0.8)
#pairs(num_frame_scaled_red, col = ct_7, pch = 19, cex = 0.8)

# 4 Clusters
fviz_cluster(list(data = num_frame_scaled_red, cluster = ct_1),
             ellipse = FALSE,
             repel = TRUE,
             show.clust.cent = FALSE,
             ggtheme = theme_minimal(),
             main = "Clusters en Euclidiana - Ward D2",
             geom = "point",
             palette = "Set5",
             alpha = 0.8
)

# 5 clusters
fviz_cluster(list(data = num_frame_scaled_red, cluster = ct_2),
             ellipse = FALSE,
             repel = TRUE,
             show.clust.cent = FALSE,
             ggtheme = theme_minimal(),
             main = "Clusters en Euclidiana - Ward D2",
             geom = "point",
             palette = "Set5",
             alpha = 0.8
)

# 6 clusters
fviz_cluster(list(data = num_frame_scaled_red, cluster = ct_3),
             ellipse = FALSE,
             repel = TRUE,
             show.clust.cent = FALSE,
             ggtheme = theme_minimal(),
             main = "Clusters en Euclidiana - Ward D2",
             geom = "point",
             palette = "Set5",
             alpha = 0.8
)

hopkins_stat <- hopkins(num_frame_scaled_red)
print(paste("Hopkins Statistic:", round(hopkins_stat, 3)))


# Taulell de tamanys
cluster_sizes <- table(ct_2)
print(cluster_sizes)

barplot(cluster_sizes, main = "Tamany dels clusters", xlab = "Clusters", ylab = "Nombre d'Observacions", col = "coral")




