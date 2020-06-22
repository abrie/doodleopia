import numpy as np
import matplotlib.pyplot as plt

data = np.fromfile("../backend/data/sizes.log", dtype="int64")
print(data.shape)
plt.hist(data, 50)
plt.title('Message Size Distribution')
plt.xlim(min(data), max(data))
plt.ylabel('Count')
plt.xlabel('Message Size (bytes)')

plt.savefig("size-histogram.png")
