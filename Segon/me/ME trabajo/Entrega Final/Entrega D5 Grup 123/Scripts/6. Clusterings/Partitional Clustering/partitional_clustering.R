

rm(list=ls())

library(scatterplot3d)  
library(flexclust)      
library(NbClust)        
library(factoextra)     
library(kernlab)        
library(clValid)        
library(cluster)        


################################################################################
# Preparació de les dades
################################################################################

mi_dataset <- read.csv("C:/Users/Pablo/Desktop/Carpetas/Uni/3r_cuatri/ME/1. PartitionalClustering/base_principal_processed.csv")

n_total <- nrow(mi_dataset)

set.seed(123)
n_red <- 1000
s <- sample(1:n_total, n_red)
datos_reducidos <- mi_dataset[s, ]

variables_submuestra <- datos_reducidos[, c("Age", "BMI", "Blood.Pressure", "Cholesterol.Levels", "Blood.Glucose.Levels", "Insulin.Levels")]
variables_escaladas <- as.data.frame(scale(variables_submuestra))

pairs(variables_escaladas, main = "Relaciones entre variables escaladas (Submuestra)")
heatmap(as.matrix(variables_submuestra), main = "Heatmap inicial")
heatmap(as.matrix(variables_escaladas), main = "Heatmap inicial (escalades)")

################################################################################
# Càlcul del nombre de clusters necessaris
################################################################################

set.seed(12345)
EV <- IW <- c()  # Explained variability (EV) y Inertia Within (IW)

for (k in 1:10) {
  km <- kmeans(variables_pca, centers = k, nstart = 50, iter.max = 200)
  EV[k] <- km$betweenss / km$totss  
  IW[k] <- km$tot.withinss          
}
par(mfrow = c(1, 2))  
plot(1:10, EV, type = "b", pch = 19, xlab = "Número de clusters", ylab = "Variabilidad explicada")
plot(1:10, IW, type = "b", pch = 19, xlab = "Número de clusters", ylab = "Inercia intra-cluster")

fviz_nbclust(variables_pca, kmeans, method="wss")
########################

set.seed(12345)
ncluster <- NbClust(variables_pca, min.nc=2, max.nc=15, method="kmeans")
ncluster
barplot(table(ncluster$Best.n[1,]))
heatmap(scale(ncluster$All.index),Rowv=NA,Colv=NA)
########################

km_3 <- kmeans(variables_pca, centers=3)
silhouette_scores <- silhouette(km_3$cluster, dist(variables_pca))
fviz_silhouette(silhouette_scores) # Visualize silhouette scores


################################################################################
# Aplicació K-means amb un PCA
################################################################################

pca_res <- prcomp(variables_escaladas, scale. = TRUE)

fviz_eig(pca_res, addlabels = TRUE, ylim = c(0, 100)) +
  ggtitle("Varianza explicada por componentes principales")

variables_pca <- as.data.frame(pca_res$x[, 1:2])

set.seed(12345)
km0 <- kmeans(variables_pca, centers=3)
km0$cluster                         
km0$centers                         
km0$totss                           
km0$withinss                        
km0$tot.withinss                    
km0$betweenss                       
km0$size                            
km0$iter                            

with(km0,betweenss/totss)           

################################################################################
# K-medoids: PAM
################################################################################

kmedoids3 <- pam(variables_pca,3)
fviz_cluster(list(data = variables_pca, cluster = kmedoids3$cluster),ellipse.type = "convex",
             repel = TRUE,                                        
             show.clust.cent = FALSE, ggtheme = theme_minimal())

t1 <- table(km0$cluster,kmedoids3$cluster)
randIndex(t1)   # rand ~ 1 --> Imply same clusterization

################################################################################
# Representació gràfica
################################################################################

fviz_cluster(km0, data = variables_pca, 
             ellipse.type = "convex", 
             geom = "point", 
             show.clust.cent = TRUE, 
             repel = FALSE) + 
  ggtitle("K-means en espai PCA")


pairs(variables_pca, pch = 19, cex = 0.8, col = km0$cluster)

x <- variables_pca$PC1
y <- variables_pca$PC2
plot(x, y, pch = 19, col = km0$cluster,
     main = "Dos primeres components de PCA",
     xlab = "PC1", ylab = "PC2")

scatterplot3d(x = variables_pca$PC1,
              y = variables_pca$PC2,
              z = rep(0, nrow(variables_pca)), 
              type = "h", pch = 19,
              angle = 60, color = km0$cluster,
              main = "Representació 3D de PCA amb clusters")


################################################################################
# Tamany dels clusters
################################################################################

cluster_sizes_kmeans <- data.frame(
  Cluster = 1:length(km0$size),
  Size = km0$size
)
print("Cluster sizes for K-means:")
print(cluster_sizes_kmeans)


