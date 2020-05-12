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
        [Required, DisplayName("Document ID")]
        public string DocsId { get; set; }

        [Required, DisplayName("Connection type")]
        public ConnectionMode ConnMode { get; set; }
    }

    public enum ConnectionMode
    {
        Open,
        Create
    }
}
