import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Data per kategori (mean dari Machine 3 - Iterasi 2 & 3)
data = {
    'Kategori': ['Batch Operations', 'Complex Queries', 'Concurrent Requests'],
    'SQL': [
        (17.788241 + 18.478769 + 17.513023 + 20.275919 + 64.229676 + 63.231150 + 16.093089 + 18.515941 + 16.758215 + 15.248457) / 10,
        (8.109500 + 24.666200 + 31.133700 + 23.909500 + 24.913800 + 30.341300) / 6,
        (47.654304 + 29.586032 + 39.966856 + 25.395928) / 4,
    ],
    'NoSQL': [
        (13.653246 + 13.929377 + 14.255008 + 14.660055 + 120.495679 + 109.324084 + 14.494664 + 11.873937 + 18.659173 + 15.193236) / 10,
        (36.507700 + 36.830700 + 7.285900 + 7.046400 + 19.691500 + 19.159000) / 6,
        (163.214528 + 116.159256 + 78.475862 + 30.912484) / 4,
    ]
}

# Konversi ke DataFrame
df = pd.DataFrame(data)

# Set posisi bar
x = np.arange(len(df['Kategori']))  # [0, 1, 2]
width = 0.35

# Plotting
fig, ax = plt.subplots(figsize=(10, 6))
bars1 = ax.bar(x - width/2, df['SQL'], width, label='SQL Backend', color='#4ECDC4')
bars2 = ax.bar(x + width/2, df['NoSQL'], width, label='NoSQL Backend', color='#FF6B6B')

# Label dan judul
ax.set_ylabel('Mean Response Time (ms)', fontsize=12)
ax.set_xlabel('Kategori Operasi', fontsize=12)
ax.set_title('Perbandingan Performa SQL vs NoSQL\n(Batch, Complex, Concurrent)', fontsize=14, fontweight='bold')
ax.set_xticks(x)
ax.set_xticklabels(df['Kategori'], fontsize=11)
ax.legend()

# Tampilkan nilai di atas bar
for bar in bars1 + bars2:
    height = bar.get_height()
    ax.annotate(f'{height:.1f}',
                xy=(bar.get_x() + bar.get_width() / 2, height),
                xytext=(0, 4),  # offset text 4 pt ke atas
                textcoords="offset points",
                ha='center', va='bottom', fontsize=9)

ax.grid(True, axis='y', alpha=0.3)
fig.tight_layout()
plt.show()
