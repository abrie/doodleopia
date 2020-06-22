import numpy as np
import matplotlib.pyplot as plt

data = np.fromfile("../backend/sizes.log", dtype="int64")
print(data.shape)
plt.hist(data)
plt.title('Message Size Distribution')
plt.ylabel('Count')
plt.xlabel('Message Size (bytes)')

plt.savefig("size-histogram.png")
