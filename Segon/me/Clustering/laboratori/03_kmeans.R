################################################################################
#
# ME - GIA. Introduction to partitional clustering
#
#--------------------------------------
# Concepts
#--------------------------------------
#
# K-means
################################################################################

rm(list=ls())

################################################################################
# Load packages
################################################################################
library(scatterplot3d)  # plot 3D 
library(flexclust)
library(NbClust)        # NbClust
library(factoextra)     # fviz_***
library(kernlab)        # kkmeans
library(clValid)        # clValid
library(cluster)        # pam

################################################################################
# Inspect data
################################################################################
data(iris)             # Load data
View(iris)             # View data
iris1 <- iris[,-5]     # Remove "species" 
iris2 <- as.data.frame(scale(iris1))  # Scaled data

windows()
pairs(iris1)               # Plots 2 by 2
heatmap(as.matrix(iris1))  # Heatmap w/o scaling
heatmap(as.matrix(iris2))  # Scaled Heatmap 

################################################################################
# Objects from K-means
################################################################################
##-- Simple test
set.seed(12345)
km0 <- kmeans(iris2, centers=3)
km0$cluster                         # Allocation to clusters
km0$centers                         # Coordinates of the gravity centers
km0$totss                           # Total Inertia
km0$withinss                        # Intra-cluster Inertia for each cluster
km0$tot.withinss                    # Intra-cluster Inertia (global)
km0$betweenss                       # Between-cluster Inertia
km0$size                            # Size of the clusters
km0$iter                            # Number of iterations to converge

with(km0,betweenss/totss)           # Explained variability

################################################################################
# Number of clusters
################################################################################

##-- Number of clusters according to Elbow rule ¿3?
set.seed(12345)
EV <- IW <- c() # Explained variability (EV) and  Inertia Within (IW)
for (k in 1:10){
  km <- kmeans(iris2, centers=k, nstart=10)
  EV[k] <- km$betweenss/km$totss
  IW[k] <- km$tot.withinss
}
par(mfrow=c(1,2))
plot(EV,type="b",pch=19,xlab="Number of clusters",ylab="Explained variability")
plot(IW,type="b",pch=19,xlab="Number of clusters",ylab="Inertia Within")

##-- Elbow rule (Intra-cluster Inertia) --> Equivalent to previous
fviz_nbclust(iris2, kmeans, method="wss")

##-- Number of clusters according to indicators ¿2?
set.seed(12345)
ncluster <- NbClust(iris2, min.nc=2, max.nc=15, method="kmeans")
ncluster
barplot(table(ncluster$Best.n[1,]))
heatmap(scale(ncluster$All.index),Rowv=NA,Colv=NA)

##-- Silhoutte amb 2 cluster
km2 <- kmeans(iris2, centers=2)
silhouette_scores <- silhouette(km2$cluster, dist(iris2))
fviz_silhouette(silhouette_scores) # Visualize silhouette scores

################################################################################
# Graphical representation
################################################################################
##-- 3 clusters --------------------------------------
km3 <- kmeans(iris2,centers=3,nstart=10)

##-- Visualization 1: By pairs
pairs(iris2,pch=19,cex=0.8,col=km3[[1]])

##-- Visualization 2: Two first PCA components
pr.comp <- princomp(iris2)
x <- pr.comp$scores[,1]
y <- pr.comp$scores[,2]
plot(x,y,pch=19,col=km3$cluster)

##-- Visualization 3: Two first PCA components with ellipses
fviz_cluster(km0, data = iris2,
             geom = "point", ellipse.type = "euclid",
             main = "Cluster Visualization")

##-- Visualization 3: Two first PCA components with ellipses and labels
fviz_cluster(list(data = iris2, cluster = km3$cluster),ellipse.type = "convex",
             repel = TRUE,                                        
             show.clust.cent = FALSE, ggtheme = theme_minimal())

##-- Visualization 4: 3D representation
scatterplot3d(x = iris2$Sepal.Length,
              y = iris2$Sepal.Width,
              z = iris2$Petal.Length,
              type = "h",pch=as.numeric(iris$Species),angle=60,color=km3$cluster)

################################################################################
# K-medoids: PAM
################################################################################
##-- PAM implementation
kmedoids3 <- pam(iris2,3)
fviz_cluster(list(data = iris2, cluster = kmedoids3$cluster),ellipse.type = "convex",
             repel = TRUE,                                        # Avoid label overplotting (slow)
             show.clust.cent = FALSE, ggtheme = theme_minimal())

##-- Comparison Kmeans and Kmedioids
t1 <- table(km3$cluster,kmedoids3$cluster)
randIndex(t1)   # rand ~ 1 --> Imply same clusterization 

################################################################################
# Similarity with initial labels
################################################################################
t2 <- table(km3$cluster,iris$Species)
randIndex(t2)

################################################################################
# Non-convex datasets
################################################################################
n <- 500
set.seed(12345)

##-- Generate data in a circumference with unity radius centered in the origin
r1    <- runif(n,0,1)
alfa1 <- runif(n,0,2*pi)
x1    <- r1*cos(alfa1)
y1    <- r1*sin(alfa1)

##-- Generate data in an circular crown with radius from 2 to 3 centered in the origin
r2    <- runif(n,2,3)
alfa2 <- runif(n,0,2*pi)
x2    <- r2*cos(alfa2)
y2    <- r2*sin(alfa2)

# Merge data
df <- data.frame(x=c(x1,x2),y=c(y1,y2))
plot(y~x,df,pch=19)

##-- K-means
km2 <- kmeans(scale(df),2)
plot(y~x,df,col=km2$cluster,pch=19)

##-- kernel k-means clustering
kk <- kkmeans(scale(df),2)
plot(y~x,df,col=as.numeric(kk),pch=19)


################################################################################
# Outliers
################################################################################
set.seed(12345)
n    <- 1000                                                 # Sample size of normal data
nout <- 3                                                    # Number of outliers
x1   <- c(rnorm(n/2,10,1),rnorm(n/2,100,1),rnorm(nout,10^5)) # First dimension (variable)
x2   <- c(rnorm(n,10),rnorm(nout,10^5))                      # Second dimension (variable)

df <- data.frame(x1,x2)

par(mfrow=c(2,2),las = 1, cex.axis = 0.7,cex.lab = 0.8)

##-- Data
plot(x1,x2,log='xy',main='DATA')

##-- K-means
km1 <- kmeans(df,2,nstart=1)
plot(x1, x2, log='xy', col=km1$cluster+1, main='K-MEANS')

##-- K-medoids
km2 <- pam(df,2)
plot(x1,x2,log='xy',col=km2$cluster+1,main='PAM')

##-- K-medoids variant (CLARA)
km3 <- clara(df,2)
plot(x1, x2, log='xy', col=km3$cluster+1, main='CLARA')



################################################################################
# Select between methods and number of clusters
################################################################################
##-- According to internal measures
clv.int <- clValid(iris2, 
                   nClust     = 2:6,
                   clMethods  = c("hierarchical","kmeans","pam"), 
                   validation = "internal")
summary(clv.int)


##-- According to stability
clv.sta <- clValid(iris2, 
                   nClust     = 2:6,
                   clMethods  = c("hierarchical","kmeans","pam"), 
                   validation = "stability")
summary(clv.sta)

