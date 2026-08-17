"""直接从 HEIC 文件二进制中提取 EXIF DateTimeOriginal（不依赖外部库）。
搜索文件中的 TIFF 头标记，然后解析 EXIF IFD。"""
import struct
from datetime import datetime

def find_tiff_headers(data):
    """在二进制数据中查找所有 TIFF 头位置 (MM\x00\x2a 或 II\x2a\x00)。"""
    positions = []
    # Big-endian: MM\x00\x2a
    idx = 0
    while True:
        idx = data.find(b'MM\x00\x2a', idx)
        if idx == -1:
            break
        positions.append(('>', idx))
        idx += 1
    # Little-endian: II\x2a\x00
    idx = 0
    while True:
        idx = data.find(b'II\x2a\x00', idx)
        if idx == -1:
            break
        positions.append(('<', idx))
        idx += 1
    return positions

def parse_tiff_ifd(data, tiff_start, endian):
    """从 TIFF 头位置开始解析 IFD，寻找 DateTimeOriginal (36867), DateTime (306)。"""
    data_len = len(data)
    if tiff_start + 8 > data_len:
        return None

    ifd_offset = struct.unpack(endian + 'I', data[tiff_start+4:tiff_start+8])[0]
    ifd_abs = tiff_start + ifd_offset
    if ifd_abs + 2 > data_len:
        return None

    count = struct.unpack(endian + 'H', data[ifd_abs:ifd_abs+2])[0]

    for i in range(count):
        entry = ifd_abs + 2 + i * 12
        if entry + 12 > data_len:
            break
        tag = struct.unpack(endian + 'H', data[entry:entry+2])[0]
        ftype = struct.unpack(endian + 'H', data[entry+2:entry+4])[0]
        count_val = struct.unpack(endian + 'I', data[entry+4:entry+8])[0]

        # tag 34665 = ExifIFDPointer
        if tag == 34665 and ftype == 4:
            exif_ifd_offset = struct.unpack(endian + 'I', data[entry+8:entry+12])[0]
            exif_abs = tiff_start + exif_ifd_offset
            if exif_abs + 2 <= data_len:
                exif_count = struct.unpack(endian + 'H', data[exif_abs:exif_abs+2])[0]
                for j in range(exif_count):
                    e_entry = exif_abs + 2 + j * 12
                    if e_entry + 12 > data_len:
                        break
                    e_tag = struct.unpack(endian + 'H', data[e_entry:e_entry+2])[0]
                    e_type = struct.unpack(endian + 'H', data[e_entry+2:e_entry+4])[0]
                    e_count = struct.unpack(endian + 'I', data[e_entry+4:e_entry+8])[0]

                    # 36867 = DateTimeOriginal, 36868 = DateTimeDigitized
                    if e_tag in (36867, 36868) and e_type == 2:
                        if e_count <= 4:
                            val = data[e_entry+8:e_entry+8+e_count-1]
                        else:
                            val_offset = struct.unpack(endian + 'I', data[e_entry+8:e_entry+12])[0]
                            val_abs = tiff_start + val_offset
                            if val_abs + e_count <= data_len:
                                val = data[val_abs:val_abs+e_count-1]
                            else:
                                continue
                        try:
                            s = val.decode('ascii', errors='replace').strip('\x00')
                            return datetime.strptime(s, '%Y:%m:%d %H:%M:%S')
                        except (ValueError, TypeError):
                            pass

        # 306 = DateTime (在主 IFD 中)
        if tag == 306 and ftype == 2:
            if count_val <= 4:
                val = data[entry+8:entry+8+count_val-1]
            else:
                val_offset = struct.unpack(endian + 'I', data[entry+8:entry+12])[0]
                val_abs = tiff_start + val_offset
                if val_abs + count_val <= data_len:
                    val = data[val_abs:val_abs+count_val-1]
                else:
                    continue
            try:
                s = val.decode('ascii', errors='replace').strip('\x00')
                return datetime.strptime(s, '%Y:%m:%d %H:%M:%S')
            except (ValueError, TypeError):
                pass

    return None

def get_heic_time(path):
    """从 HEIC 文件中获取拍摄时间。"""
    with open(path, 'rb') as f:
        data = f.read()

    for endian, pos in find_tiff_headers(data):
        dt = parse_tiff_ifd(data, pos, endian)
        if dt:
            return dt
    return None

# 测试
if __name__ == '__main__':
    import os
    ARCHIVE_ROOT = r'Y:\图片视频素材合集'
    heic_file = None
    for d in os.listdir(ARCHIVE_ROOT):
        if d.startswith('手机照片存档'):
            for root, dirs, files in os.walk(os.path.join(ARCHIVE_ROOT, d)):
                for fn in files:
                    if fn.lower().endswith('.heic'):
                        heic_file = os.path.join(root, fn)
                        break
                if heic_file:
                    break
        if heic_file:
            break

    if heic_file:
        print(f'测试文件: {heic_file}')
        dt = get_heic_time(heic_file)
        if dt:
            print(f'拍摄时间: {dt.strftime("%Y-%m-%d %H:%M:%S")}')
        else:
            print('未找到 EXIF 时间')

        # 测试更多文件
        print('\n=== 测试前10个 HEIC 文件 ===')
        heic_files = []
        for d in os.listdir(ARCHIVE_ROOT):
            if d.startswith('手机照片存档'):
                for root, dirs, files in os.walk(os.path.join(ARCHIVE_ROOT, d)):
                    for fn in files:
                        if fn.lower().endswith('.heic'):
                            heic_files.append(os.path.join(root, fn))
        print(f'总共 {len(heic_files)} 个 HEIC 文件')
        found = 0
        for hf in heic_files[:10]:
            dt = get_heic_time(hf)
            if dt:
                found += 1
                print(f'  {os.path.basename(hf)} → {dt.strftime("%Y-%m-%d %H:%M:%S")}')
            else:
                print(f'  {os.path.basename(hf)} → 未找到')
        print(f'前10个中找到 {found} 个时间')
