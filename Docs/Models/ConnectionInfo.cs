using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace Docs.Models
{
    public class ConnectionInfo
    {
        [Required, DisplayName("User name")]
        public string UserName { get; set; }

        [Required, DisplayName("Document ID")]
        public string DocId { get; set; }

        [Required, DisplayName("Document password"), DataType(DataType.Password)]
        public string DocPasswd { get; set; }
    }
}
