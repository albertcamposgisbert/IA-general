################################################################################
#
# ME - GIA. Introduction to hierarchical clustering
#
#--------------------------------------
# Concepts
#--------------------------------------
#
# Hierarchical clustering
################################################################################

rm(list=ls())

################################################################################
# Load packages
################################################################################
library(NbClust)    # Function NbClust
library(factoextra) # Several clustering graphics
library(hopkins)    # Hopkins index
library(FactoMineR) # Factor analysis
library(dendextend) # Compare dendograms
library(corrplot)   # Correlation graphics

################################################################################
# Inspect data
################################################################################
data (iris)                # Load data
View(iris)                 # Inspect data
iris1 <- iris[,1:4]        # Remove "species" 
iris2 <- scale(iris1)      # Scaled data

windows()
pairs(iris1)               # Plots 2 by 2
heatmap(as.matrix(iris1))  # Heatmap w/o scaling
heatmap(as.matrix(iris2))  # Scaled Heatmap 

################################################################################
# Hierarchical clustering 
################################################################################
##-- 1. Distance matrix
d <- dist(iris2, method = "euclidean")     # Distance matrix
View(as.matrix(d))                         # view Distance matrix
fviz_dist(dist(iris2))                     # Visually


##-- 2. Clustering
hc <- hclust(d,method = "complete")        # Hierarchical clustering


##-- 3. Plot hierarchical clustering
windows(14,7)                              # Graphic window
plot(hc,cex=0.7)                           # Dendrogram             


##-- 4. Assess dendrogram quality
cop.dist <- cophenetic(hc)
cor(d, cop.dist)


##-- 5. Partition
fviz_nbclust(iris2,hcut,method=c("wss"))  # Elbow rule
NB <- NbClust(iris2, method = 'ward.D2')  # Number of clusters by several criteria
ct <- cutree(hc,3)                        # Select the number of clusters
fviz_dend(hc, k = 3, rect=TRUE, lwd=2)

##-- All in one
HC <- HCPC(iris2, method = "complete")   

##-- 6. Graphical representation
# By pairs
pairs(iris2, col=ct)                        

# According to principal components
pr <- princomp(iris2)                       
x  <- pr$scores[,1]
y  <- pr$scores[,2]
z  <- pr$scores[,3]
par(mfrow=c(1,3))
plot(x, y, col=ct, pch=19)
plot(x, z, col=ct, pch=19)
plot(y, z, col=ct, pch=19)

# With ellipses
fviz_cluster(list(data = iris2, cluster = ct),ellipse.type = "convex",
             repel = TRUE,                                              
             show.clust.cent = FALSE, ggtheme = theme_minimal())


##-- 7. Accuracy (Pay attention: it does not apply to clustering)
table(iris$Species,ct)
cl <- ct
# cl <- ifelse(ct==1,1,ifelse(ct==2,3,2))
# (t.pred <- table(iris$Species,cl))
# sum(diag(t.pred))/sum(t.pred)
pairs(iris2,cex=0.8,col=cl,pch=as.numeric(iris$Species))


##-- 8. Comparing dendrograms
hc1 <- hclust(d,method = "complete")  # Hierarchical clustering
hc2 <- hclust(d,method = "average")   # Hierarchical clustering
tanglegram(hc1,hc2)

# Cophenetic correlation between dedrograms
dend_list <- dendlist(as.dendrogram (hc1), as.dendrogram (hc2))
cor.dendlist(dend_list, method = "cophenetic")

# Comparing 4 dendrograms
hc3 <- hclust(d, method = "ward.D2")     # Hierarchical clustering
hc4 <- hclust(d, method = "single")      # Hierarchical clustering
dend_list <- dendlist(as.dendrogram (hc1), 
                      as.dendrogram (hc2),
                      as.dendrogram (hc3), 
                      as.dendrogram (hc4))
par(mfrow=c(1,1))
corrplot(cor.dendlist(dend_list, method = "cophenetic"), "ellipse", "lower")

##-- 9. Cluster tendency
# Hopkins statistic
set.seed(12345)
hop <- hopkins(iris2, m = nrow(iris2)-1)
hop                                     # Close to 1    --> There is cluster tendency

# Example w/o cluster tendency
mm <- matrix(runif(3000),ncol=3)
plot(mm[,1],mm[,2], pch=19, cex=0.5)
hopkins(mm, m = nrow(mm)-1)             # Close to 0.5  --> There is not cluster tendency





